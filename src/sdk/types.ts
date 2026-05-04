/**
 * Core domain types for the Awel agent-to-agent protocol.
 *
 * These interfaces describe the wire-level shapes exchanged across the six
 * Awel layers — Identity, Discovery, Payments, Tasks, Receipts, Reputation.
 * They are intentionally transport-agnostic: an HTTP, gRPC, or in-process
 * binding can all serialize/deserialize the same structures.
 */

/** Opaque, globally-unique agent identifier (DID-style, e.g. `did:awel:7Qf…`). */
export type AgentId = string;

/** Opaque task identifier issued by the Tasks layer on acceptance. */
export type TaskId = string;

/** Opaque receipt identifier issued by the Receipts layer on settlement. */
export type ReceiptId = string;

/** ISO-8601 timestamp string (UTC). */
export type Timestamp = string;

/**
 * Settlement rail used by the Payments layer.
 *
 * - `x402`     — HTTP 402 "Payment Required" challenge/response flow.
 * - `mpp`      — Micro-Payment Channels for streaming, per-call settlement.
 * - `usdc-sol` — Direct USDC transfer settled on Solana.
 */
export type PaymentRail = "x402" | "mpp" | "usdc-sol";

/** Lifecycle state of a task as tracked by the Tasks layer. */
export type TaskStatus =
  | "pending"
  | "accepted"
  | "running"
  | "completed"
  | "failed"
  | "disputed"
  | "cancelled";

/**
 * A capability advertised by an agent in the Discovery layer.
 * `name` is a reverse-DNS-style identifier; `schema` is an optional JSON-schema
 * URI describing the expected input payload.
 */
export interface Capability {
  name: string;
  version: string;
  schema?: string;
}

/** Pricing terms an agent attaches to a capability. */
export interface PriceQuote {
  rail: PaymentRail;
  /** Amount in the rail's smallest unit (USDC = 6 decimals → micro-USDC). */
  amount: bigint;
  currency: "USDC";
  /** Optional per-call ceiling for streaming `mpp` channels. */
  perCallCap?: bigint;
}

/**
 * An agent as represented in the Identity + Discovery layers.
 */
export interface Agent {
  id: AgentId;
  /** Human-readable handle (non-unique). */
  name: string;
  /** Ed25519 public key (base58) used to verify the agent's signatures. */
  publicKey: string;
  endpoint: string;
  capabilities: Capability[];
  rails: PaymentRail[];
  /** Cached reputation score in [0, 1]; authoritative source is Reputation layer. */
  reputationScore: number;
  registeredAt: Timestamp;
  metadata?: Record<string, string>;
}

/**
 * A unit of delegated work tracked by the Tasks layer.
 */
export interface Task {
  id: TaskId;
  /** Agent that issued the task. */
  from: AgentId;
  /** Agent assigned to perform the task. */
  to: AgentId;
  capability: string;
  /** Arbitrary JSON-serializable input payload. */
  input: unknown;
  status: TaskStatus;
  quote: PriceQuote;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Present once the task reaches a terminal state. */
  result?: unknown;
  /** Receipt issued on successful settlement. */
  receiptId?: ReceiptId;
}

/**
 * A signed, verifiable record of a completed task + its settlement.
 * Receipts are the audit trail that feeds the Reputation layer.
 */
export interface Receipt {
  id: ReceiptId;
  taskId: TaskId;
  from: AgentId;
  to: AgentId;
  rail: PaymentRail;
  amountSettled: bigint;
  currency: "USDC";
  /** On-chain signature or channel-close proof, depending on the rail. */
  settlementProof: string;
  /** Hash of the task result the receipt attests to. */
  resultHash: string;
  issuedAt: Timestamp;
}

/**
 * An agent's standing in the Reputation layer.
 * `score` is the public-facing number; `stakedReputation` is the bonded
 * collateral subject to slashing (see {@link ../reputation/slashing}).
 */
export interface Reputation {
  agent: AgentId;
  /** Composite score in [0, 1]. */
  score: number;
  completedTasks: number;
  disputesLost: number;
  /** Bonded reputation collateral at risk of slashing. */
  stakedReputation: bigint;
  isJailed: boolean;
  isTombstoned: boolean;
  updatedAt: Timestamp;
}
