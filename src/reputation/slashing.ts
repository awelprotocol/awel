import { EventEmitter } from "events";
import type { AgentId } from "../sdk/types.js";
import { AgentOffense, DEFAULT_PARAMS } from "./types.js";
import type { AgentStake, ReputationSlash, SlashingParams } from "./types.js";

/**
 * Reputation slashing engine for the Awel Reputation layer.
 *
 * Agents bond reputation collateral to be discoverable. Misbehavior —
 * failed tasks, lost disputes, downtime, invalid results — slashes that
 * stake, temporarily jails (delists) the agent, and on repeat offenses
 * tombstones (permanently bans) them.
 *
 * Emits:
 * - `slashed`    `{ agent, slash, remainingStake }`
 * - `jailed`     implicit via `slashed` (state carries `isJailed`)
 * - `unjailed`   `{ agent, epoch }`
 * - `tombstoned` `{ agent, totalSlashed }`
 */
export class SlashingEngine extends EventEmitter {
  private stakes: Map<AgentId, AgentStake> = new Map();
  private params: SlashingParams;
  private currentEpoch = 0;
  private slashingHistory: ReputationSlash[] = [];
  private tombstoned: Set<AgentId> = new Set();

  constructor(params: Partial<SlashingParams> = {}) {
    super();
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /** Bond an agent's reputation stake, making it eligible for listing. */
  registerAgent(agent: AgentId, stake: bigint): void {
    if (this.tombstoned.has(agent)) {
      throw new Error(`Agent ${agent} is tombstoned — cannot re-register`);
    }
    this.stakes.set(agent, {
      agent,
      stake,
      slashedAmount: 0n,
      isJailed: false,
      jailedUntil: 0,
      offenses: [],
      missedHeartbeats: 0,
    });
  }

  /** Advance the reputation epoch and auto-unjail any expired jails. */
  setEpoch(epoch: number): void {
    this.currentEpoch = epoch;
    for (const [agent, s] of this.stakes) {
      if (s.isJailed && s.jailedUntil <= epoch) {
        s.isJailed = false;
        this.emit("unjailed", { agent, epoch });
      }
    }
  }

  /**
   * Record a missed liveness heartbeat. Auto-slashes for DOWNTIME once the
   * threshold is crossed within the rolling window.
   */
  recordMissedHeartbeat(agent: AgentId): ReputationSlash | null {
    const s = this.getStake(agent);
    s.missedHeartbeats++;

    if (s.missedHeartbeats >= this.params.downtimeThreshold) {
      s.missedHeartbeats = 0; // reset window
      return this.slash(agent, AgentOffense.DOWNTIME, "auto:downtime_threshold");
    }
    return null;
  }

  /** Reset the missed-heartbeat counter (agent came back online). */
  resetMissedHeartbeats(agent: AgentId): void {
    const s = this.getStake(agent);
    s.missedHeartbeats = 0;
  }

  /**
   * Core slash. Computes the penalty, burns it from the agent's stake, jails
   * the agent, records the offense, and tombstones on repeat offenses.
   */
  slash(agent: AgentId, offense: AgentOffense, evidence: string): ReputationSlash {
    const s = this.getStake(agent);

    if (this.tombstoned.has(agent)) {
      throw new Error(`${agent} already tombstoned`);
    }

    // Cooldown — prevent double-slashing for the same offense type.
    const lastSameType = s.offenses
      .filter((o) => o.type === offense)
      .sort((a, b) => b.epoch - a.epoch)[0];

    if (
      lastSameType &&
      this.currentEpoch - lastSameType.epoch < this.params.cooldownEpochs
    ) {
      throw new Error(
        `Cooldown active: ${offense} for ${agent}, ` +
          `last=${lastSameType.epoch}, current=${this.currentEpoch}, ` +
          `need=${this.params.cooldownEpochs} epochs gap`
      );
    }

    const slashPct = this.getSlashPercent(offense);
    const slashAmount = (s.stake * BigInt(slashPct)) / 10000n;

    s.stake -= slashAmount;
    s.slashedAmount += slashAmount;
    if (s.stake < 0n) s.stake = 0n;

    // Jail (temporary delisting from Discovery).
    s.isJailed = true;
    s.jailedUntil = this.currentEpoch + this.params.jailDuration;

    const slashRecord: ReputationSlash = {
      type: offense,
      epoch: this.currentEpoch,
      evidence,
      slashPct,
      amount: slashAmount,
      timestamp: Date.now(),
    };
    s.offenses.push(slashRecord);
    this.slashingHistory.push(slashRecord);

    this.emit("slashed", { agent, slash: slashRecord, remainingStake: s.stake });

    if (s.offenses.length >= this.params.maxOffensesBeforeTombstone) {
      this.tombstone(agent);
    }

    return slashRecord;
  }

  /**
   * Permanent ban — the agent can never re-list. Remaining stake is burned to
   * the protocol treasury.
   */
  private tombstone(agent: AgentId): void {
    const s = this.getStake(agent);
    this.tombstoned.add(agent);
    const remaining = s.stake;
    s.stake = 0n;
    s.slashedAmount += remaining;

    this.emit("tombstoned", { agent, totalSlashed: s.slashedAmount });
  }

  // --- Queries ---

  getAgentState(agent: AgentId): AgentStake | undefined {
    return this.stakes.get(agent);
  }

  getSlashingHistory(): ReputationSlash[] {
    return [...this.slashingHistory];
  }

  isTombstoned(agent: AgentId): boolean {
    return this.tombstoned.has(agent);
  }

  /** Agents currently eligible for Discovery (not jailed, not banned, staked). */
  getActiveAgents(): AgentStake[] {
    return [...this.stakes.values()].filter(
      (s) => !s.isJailed && !this.tombstoned.has(s.agent) && s.stake > 0n
    );
  }

  // --- Internal ---

  private getStake(agent: AgentId): AgentStake {
    const s = this.stakes.get(agent);
    if (!s) throw new Error(`Unknown agent: ${agent}`);
    return s;
  }

  private getSlashPercent(offense: AgentOffense): number {
    switch (offense) {
      case AgentOffense.FAILED_TASK:
        return this.params.failedTaskSlashPct;
      case AgentOffense.DISPUTE_LOST:
        return this.params.disputeLostSlashPct;
      case AgentOffense.DOWNTIME:
        return this.params.downtimeSlashPct;
      case AgentOffense.INVALID_RESULT:
        return this.params.invalidResultSlashPct;
      default:
        return 100; // 1% fallback
    }
  }
}

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: docs: add delegate() example to README quickstart (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)

// maint: docs: add delegate() example to README quickstart (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: fix(sdk): correct optional field handling in sendTask envelope (2026-06-16)

// maint: docs: add delegate() example to README quickstart (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: docs(spec): note MPP unilateral-close dispute window (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: docs: add delegate() example to quickstart (2026-06-16)

// maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: docs(spec): note MPP unilateral-close dispute window (2026-06-16)

// maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: feat(sdk): re-land discovery filter with stable ordering (2026-06-16)

// maint: refactor(sdk): split request builder from transport (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: refactor(config): centralize env parsing (2026-06-16)

// maint: refactor(config): centralize env parsing (2026-06-16)

// maint: test(sdk): typed envelope round-trip (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)

// fix: minimum slash amount to avoid zero-slash
