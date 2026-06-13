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

// metrics: tasks_total, slash_total, settle_seconds
