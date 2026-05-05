import type { AgentId } from "../sdk/types.js";

/**
 * Offenses that can slash an agent's staked reputation in the Reputation layer.
 *
 * - `FAILED_TASK`    — Agent accepted a task and failed to deliver a result.
 * - `DISPUTE_LOST`   — A dispute over a delivered result was resolved against the agent.
 * - `DOWNTIME`       — Agent missed too many liveness heartbeats while listed.
 * - `INVALID_RESULT` — Agent returned a result that failed verification (bad `resultHash`).
 */
export enum AgentOffense {
  FAILED_TASK = "FAILED_TASK",
  DISPUTE_LOST = "DISPUTE_LOST",
  DOWNTIME = "DOWNTIME",
  INVALID_RESULT = "INVALID_RESULT",
}

/** A single recorded slash against an agent's stake. */
export interface ReputationSlash {
  type: AgentOffense;
  /** Reputation epoch at which the slash occurred. */
  epoch: number;
  /** Hash of the evidence payload (task id, dispute ruling, missed-heartbeat log). */
  evidence: string;
  /** Slash size in basis points (100 = 1%). */
  slashPct: number;
  /** Amount of staked reputation burned. */
  amount: bigint;
  /** Wall-clock time the slash was applied. */
  timestamp: number;
}

/**
 * Bonded state for an agent participating in reputation staking.
 * Mirrors the staking subset of {@link ../sdk/types.Reputation}.
 */
export interface AgentStake {
  agent: AgentId;
  /** Staked reputation collateral subject to slashing. */
  stake: bigint;
  /** Cumulative reputation burned across all slashes. */
  slashedAmount: bigint;
  /** Temporarily delisted from Discovery while jailed. */
  isJailed: boolean;
  /** Epoch at which the jail period ends. */
  jailedUntil: number;
  offenses: ReputationSlash[];
  /** Rolling counter of missed liveness heartbeats. */
  missedHeartbeats: number;
}

/** Tunable parameters governing the slashing engine. */
export interface SlashingParams {
  /** Slash for failing an accepted task, in basis points. */
  failedTaskSlashPct: number;
  /** Slash for losing a dispute, in basis points. */
  disputeLostSlashPct: number;
  /** Slash for crossing the downtime threshold, in basis points. */
  downtimeSlashPct: number;
  /** Slash for returning an invalid result, in basis points. */
  invalidResultSlashPct: number;
  /** Rolling window (in heartbeats) for downtime tracking. */
  downtimeWindow: number;
  /** Missed heartbeats that trigger an auto-slash. */
  downtimeThreshold: number;
  /** Jail length in epochs after any slash. */
  jailDuration: number;
  /** Offense count that triggers a permanent tombstone (ban). */
  maxOffensesBeforeTombstone: number;
  /** Minimum epochs between two slashes of the same offense type. */
  cooldownEpochs: number;
}

export const DEFAULT_PARAMS: SlashingParams = {
  failedTaskSlashPct: 500, // 5%
  disputeLostSlashPct: 1000, // 10%
  downtimeSlashPct: 10, // 0.1%
  invalidResultSlashPct: 2000, // 20%
  downtimeWindow: 100,
  downtimeThreshold: 50,
  jailDuration: 3, // 3 epochs
  maxOffensesBeforeTombstone: 5,
  cooldownEpochs: 2,
};
