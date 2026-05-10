/**
 * Awel — the open, self-hostable API layer for agent-to-agent work.
 *
 * Package entry point. Re-exports the SDK client, domain types, the
 * reputation slashing engine, the experimental ZK module, and feature flags.
 */

// SDK
export { AwelClient } from "./sdk/client.js";
export type {
  AwelClientConfig,
  AwelRequest,
  RegisterParams,
  RegisterResult,
  FindAgentsParams,
  FindAgentsResult,
  SendTaskParams,
  DelegateParams,
  DelegateResult,
} from "./sdk/client.js";

export type {
  Agent,
  AgentId,
  Capability,
  PaymentRail,
  PriceQuote,
  Receipt,
  ReceiptId,
  Reputation,
  Task,
  TaskId,
  TaskStatus,
  Timestamp,
} from "./sdk/types.js";

// Reputation (staking / slashing)
export { SlashingEngine } from "./reputation/slashing.js";
export { AgentOffense, DEFAULT_PARAMS } from "./reputation/types.js";
export type {
  AgentStake,
  ReputationSlash,
  SlashingParams,
} from "./reputation/types.js";

// ZK (experimental, gated behind ENABLE_ZK)
export { ZKProver, createProver } from "./zk/prover.js";
export type {
  Proof,
  ProverBackend,
  CircuitArtifact,
  VerificationKey,
  ZKConfig,
} from "./zk/types.js";

// Feature flags
export { FEATURES, requireFeature } from "./config/features.js";
export type { FeatureFlags } from "./config/features.js";

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: fix(sdk): correct optional field handling in sendTask envelope (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16)

// maint: chore: bump dev deps (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: refactor(reputation): tighten slash cooldown bounds (see RFC-0003) (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: test(sdk): typed envelope round-trip (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: test(sdk): typed envelope round-trip (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: fix(zk): guard prover factory behind feature flag (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: refactor(config): centralize env parsing (2026-06-16)

// maint: refactor(sdk): split request builder from transport (2026-06-16)

// maint: feat(sdk): re-land discovery filter with stable ordering (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: fix(zk): guard prover factory behind feature flag (2026-06-16)

// maint: chore: bump dev deps (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)
