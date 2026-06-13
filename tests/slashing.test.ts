import { SlashingEngine } from "../src/reputation/slashing.js";
import { AgentOffense, DEFAULT_PARAMS } from "../src/reputation/types.js";

describe("SlashingEngine", () => {
  let engine: SlashingEngine;

  beforeEach(() => {
    engine = new SlashingEngine();
    engine.registerAgent("agent:alice", 1000000n);
    engine.registerAgent("agent:bob", 500000n);
    engine.setEpoch(1);
  });

  test("failed task slashes 5%", () => {
    const slash = engine.slash(
      "agent:alice",
      AgentOffense.FAILED_TASK,
      "task_hash_1",
    );
    expect(slash.amount).toBe(50000n); // 5% of 1M
    expect(engine.getAgentState("agent:alice")!.stake).toBe(950000n);
  });

  test("agent is jailed after slash", () => {
    engine.slash("agent:alice", AgentOffense.FAILED_TASK, "ev1");
    const state = engine.getAgentState("agent:alice")!;
    expect(state.isJailed).toBe(true);
    expect(state.jailedUntil).toBe(1 + DEFAULT_PARAMS.jailDuration);
  });

  test("unjail after jail duration expires", () => {
    engine.slash("agent:alice", AgentOffense.FAILED_TASK, "ev1");
    engine.setEpoch(1 + DEFAULT_PARAMS.jailDuration);
    expect(engine.getAgentState("agent:alice")!.isJailed).toBe(false);
  });

  test("downtime auto-slash after threshold", () => {
    for (let i = 0; i < DEFAULT_PARAMS.downtimeThreshold - 1; i++) {
      expect(engine.recordMissedHeartbeat("agent:bob")).toBeNull();
    }
    const slash = engine.recordMissedHeartbeat("agent:bob");
    expect(slash).not.toBeNull();
    expect(slash!.type).toBe(AgentOffense.DOWNTIME);
    // 0.1% of 500k = 500
    expect(slash!.amount).toBe(500n);
  });

  test("cooldown prevents same-type double slash", () => {
    engine.slash("agent:alice", AgentOffense.FAILED_TASK, "ev1");
    expect(() => {
      engine.slash("agent:alice", AgentOffense.FAILED_TASK, "ev2");
    }).toThrow(/Cooldown active/);
  });

  test("different offense types slash independently", () => {
    engine.slash("agent:alice", AgentOffense.FAILED_TASK, "ev1");
    // Different type — no cooldown conflict
    const slash = engine.slash("agent:alice", AgentOffense.DISPUTE_LOST, "ev2");
    expect(slash.type).toBe(AgentOffense.DISPUTE_LOST);
  });

  test("invalid result slashes 20%", () => {
    const slash = engine.slash(
      "agent:bob",
      AgentOffense.INVALID_RESULT,
      "bad_result_hash",
    );
    expect(slash.amount).toBe(100000n); // 20% of 500k
    expect(engine.getAgentState("agent:bob")!.stake).toBe(400000n);
  });

  test("tombstone after max offenses", () => {
    for (let i = 0; i < DEFAULT_PARAMS.maxOffensesBeforeTombstone; i++) {
      engine.setEpoch(1 + i * (DEFAULT_PARAMS.cooldownEpochs + 1));
      engine.slash("agent:alice", AgentOffense.FAILED_TASK, `ev${i}`);
    }
    expect(engine.isTombstoned("agent:alice")).toBe(true);
    expect(engine.getAgentState("agent:alice")!.stake).toBe(0n);
  });

  test("tombstoned agent cannot re-register", () => {
    for (let i = 0; i < DEFAULT_PARAMS.maxOffensesBeforeTombstone; i++) {
      engine.setEpoch(1 + i * (DEFAULT_PARAMS.cooldownEpochs + 1));
      engine.slash("agent:alice", AgentOffense.FAILED_TASK, `ev${i}`);
    }
    expect(() => engine.registerAgent("agent:alice", 999n)).toThrow(
      /tombstoned/,
    );
  });

  test("getActiveAgents excludes jailed", () => {
    engine.slash("agent:alice", AgentOffense.FAILED_TASK, "ev1");
    const active = engine.getActiveAgents();
    expect(active.length).toBe(1);
    expect(active[0]!.agent).toBe("agent:bob");
  });

  test("emits slashed and tombstoned events", () => {
    const slashed: string[] = [];
    let tombstonedAgent = "";
    engine.on("slashed", (e: { agent: string }) => slashed.push(e.agent));
    engine.on("tombstoned", (e: { agent: string }) => {
      tombstonedAgent = e.agent;
    });

    for (let i = 0; i < DEFAULT_PARAMS.maxOffensesBeforeTombstone; i++) {
      engine.setEpoch(1 + i * (DEFAULT_PARAMS.cooldownEpochs + 1));
      engine.slash("agent:alice", AgentOffense.FAILED_TASK, `ev${i}`);
    }

    expect(slashed.length).toBe(DEFAULT_PARAMS.maxOffensesBeforeTombstone);
    expect(tombstonedAgent).toBe("agent:alice");
  });
});
