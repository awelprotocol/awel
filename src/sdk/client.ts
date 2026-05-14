import type {
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
} from "./types.js";

/** Configuration for an {@link AwelClient} instance. */
export interface AwelClientConfig {
  /** Base URL of the Awel gateway (e.g. `https://gateway.awel.network`). */
  endpoint: string;
  /** Bearer token / API key for the calling agent. */
  apiKey?: string;
  /** Ed25519 secret key (base58) used to sign outbound requests. */
  signingKey?: string;
  /** Default payment rail when a method does not specify one. */
  defaultRail?: PaymentRail;
}

/** Parameters for {@link AwelClient.register}. */
export interface RegisterParams {
  name: string;
  publicKey: string;
  endpoint: string;
  capabilities: Capability[];
  rails: PaymentRail[];
  metadata?: Record<string, string>;
}

/** Result of a successful registration in the Identity layer. */
export interface RegisterResult {
  agent: Agent;
}

/** Query parameters for {@link AwelClient.findAgents} (Discovery layer). */
export interface FindAgentsParams {
  /** Capability name the candidate agent must advertise. */
  capability: string;
  /** Restrict to agents supporting at least one of these rails. */
  rails?: PaymentRail[];
  /** Minimum reputation score in [0, 1]. */
  minReputation?: number;
  /** Maximum number of agents to return. */
  limit?: number;
}

/** Result of a discovery query. */
export interface FindAgentsResult {
  agents: Agent[];
}

/** Parameters for {@link AwelClient.sendTask} (Tasks layer). */
export interface SendTaskParams {
  to: AgentId;
  capability: string;
  input: unknown;
  /** Price terms; if omitted the assignee's advertised quote is used. */
  quote?: PriceQuote;
  rail?: PaymentRail;
}

/** Parameters for {@link AwelClient.delegate}. */
export interface DelegateParams {
  /** Capability to fulfil; the SDK discovers a suitable agent automatically. */
  capability: string;
  input: unknown;
  minReputation?: number;
  rail?: PaymentRail;
}

/** Result of a delegation: the chosen agent plus the created task. */
export interface DelegateResult {
  agent: Agent;
  task: Task;
}

/**
 * Internal request envelope returned by the thin method stubs.
 *
 * Until the transport layer is wired, methods construct and return one of
 * these so callers (and tests) can assert on the request shape. The live
 * implementation will hand the envelope to an HTTP/gRPC dispatcher.
 */
export interface AwelRequest<TBody> {
  method: "POST" | "GET";
  /** Awel layer the request targets. */
  layer: "identity" | "discovery" | "tasks" | "receipts" | "reputation";
  path: string;
  body: TBody;
}

/**
 * Typed client for the Awel agent-to-agent protocol.
 *
 * Each method maps 1:1 to a documented SDK call. The current build ships
 * request-builder stubs: methods are fully typed and construct the request
 * envelope they will eventually dispatch, but the network transport is not
 * yet wired — calls either return the envelope (builder mode) or throw a
 * `not wired` error where a response object is required.
 *
 * @example
 * ```ts
 * const awel = new AwelClient({ endpoint: "https://gateway.awel.network" });
 * const req = awel.register({
 *   name: "summarizer",
 *   publicKey: "8f…",
 *   endpoint: "https://agent.example/awel",
 *   capabilities: [{ name: "text.summarize", version: "1.0.0" }],
 *   rails: ["x402", "usdc-sol"],
 * });
 * ```
 */
export class AwelClient {
  private readonly config: AwelClientConfig;

  constructor(config: AwelClientConfig) {
    this.config = config;
  }

  /**
   * Register the calling agent in the Identity layer and publish its
   * capabilities to Discovery.
   *
   * @param params - Identity descriptor for the agent.
   * @returns The request envelope that will be dispatched to the Identity layer.
   */
  register(params: RegisterParams): AwelRequest<RegisterParams> {
    return {
      method: "POST",
      layer: "identity",
      path: "/v1/agents",
      body: params,
    };
  }

  /**
   * Discover agents advertising a capability, optionally filtered by rail and
   * minimum reputation.
   *
   * @param params - Discovery query.
   * @returns The request envelope for the Discovery layer.
   */
  findAgents(params: FindAgentsParams): AwelRequest<FindAgentsParams> {
    return {
      method: "GET",
      layer: "discovery",
      path: "/v1/agents/search",
      body: params,
    };
  }

  /**
   * Send a task to a specific agent via the Tasks layer. Settlement is
   * negotiated through the Payments layer using the supplied or advertised
   * quote.
   *
   * @param params - Task descriptor.
   * @returns The request envelope for the Tasks layer.
   */
  sendTask(params: SendTaskParams): AwelRequest<SendTaskParams> {
    return {
      method: "POST",
      layer: "tasks",
      path: "/v1/tasks",
      body: params,
    };
  }

  /**
   * Fetch the current state of a task by id.
   *
   * @param taskId - Identifier returned by {@link sendTask}.
   * @returns The resolved {@link Task}.
   * @throws Always — the transport is not yet wired.
   */
  getTask(taskId: TaskId): Promise<Task> {
    void taskId;
    return Promise.reject(
      new Error("AwelClient.getTask is not wired: no transport configured")
    );
  }

  /**
   * Discover a suitable agent and dispatch a task to it in one call.
   * Combines Discovery + Tasks for the common "I need X done" path.
   *
   * @param params - Capability + input to delegate.
   * @returns The chosen agent and created task.
   * @throws Always — the transport is not yet wired.
   */
  delegate(params: DelegateParams): Promise<DelegateResult> {
    void params;
    return Promise.reject(
      new Error("AwelClient.delegate is not wired: no transport configured")
    );
  }

  /**
   * Retrieve a settlement receipt from the Receipts layer.
   *
   * @param receiptId - Identifier carried on a completed {@link Task}.
   * @returns The resolved {@link Receipt}.
   * @throws Always — the transport is not yet wired.
   */
  getReceipt(receiptId: ReceiptId): Promise<Receipt> {
    void receiptId;
    return Promise.reject(
      new Error("AwelClient.getReceipt is not wired: no transport configured")
    );
  }

  /**
   * Read an agent's standing from the Reputation layer.
   *
   * @param agentId - Agent to look up.
   * @returns The resolved {@link Reputation}.
   * @throws Always — the transport is not yet wired.
   */
  getReputation(agentId: AgentId): Promise<Reputation> {
    void agentId;
    return Promise.reject(
      new Error("AwelClient.getReputation is not wired: no transport configured")
    );
  }
}

// maint: docs(spec): note MPP unilateral-close dispute window (RFC-0002) (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: docs: add delegate() example to README quickstart (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: refactor(config): centralize env parsing (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: test(sdk): typed envelope round-trip (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: docs: add delegate() example to quickstart (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: docs(spec): note MPP unilateral-close dispute window (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)

// maint: refactor(reputation): tighten slash cooldown bounds (RFC-0003) (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: refactor(reputation): tighten slash cooldown bounds (RFC-0003) (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)
