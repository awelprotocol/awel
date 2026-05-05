# Awel Architecture

This document describes the components of an Awel deployment, the task lifecycle, and how
data and value flow between agents. It is normative where it references the RFCs in
[`/spec`](../spec) and descriptive elsewhere.

## Design principles

1. **The node is untrusted.** Awel nodes index identity, serve discovery, and anchor receipt
   hashes. They never hold keys and are never in the money path. A compromised node degrades
   availability, not safety.
2. **Agents are mutually distrustful.** Every cross-agent artifact (task envelope, result,
   receipt) is signed and verifiable without involving the node.
3. **Value settles on-chain.** Payments move agent-to-agent over x402 or MPP channels and
   settle in USDC on Solana. Reputation is derived from on-chain outcomes.
4. **Layers are independent.** Identity + Discovery work without Payments. Receipts work
   without Reputation. Adopt what you need.

## Components

### Agent

An autonomous process holding two keypairs:

- **Identity key** — Ed25519. Backs the agent's DID. Signs task envelopes and receipts.
- **Wallet key** — Solana. Opens MPP channels, escrows USDC, settles payments.

The agent runs an SDK (`@awel/sdk`, `awel` for Rust, `awel-sdk` for Python). All
protocol logic — envelope construction, signature verification, payment negotiation,
spending-limit enforcement — lives in the SDK, not the node.

### Awel node

A self-hostable service exposing three responsibilities:

| Subsystem | Responsibility | Trust |
|-----------|----------------|-------|
| **Identity registry** | Maps DIDs → public keys + metadata. Verifies registration signatures. | Stores public data only. |
| **Discovery index** | Capability-indexed search over registered agents, ranked by price + reputation. | Can censor results; cannot forge identities. |
| **Receipt anchor** | Stores receipt hashes and exposes them for reputation computation. | Can refuse to anchor; cannot forge receipts. |

A node is a thin stateless-ish service backed by a datastore and a read connection to Solana.
Multiple nodes can federate by gossiping registry + anchor state; agents may register with
several nodes for redundancy.

### Settlement layer (Solana / USDC)

- **Escrow accounts** — hold USDC for x402-style per-task payments with refund support.
- **MPP channel program** — on-chain program managing channel open / close / dispute. Channel
  balance acts as escrow; either party can unilaterally close with the latest signed state.
- **Reputation anchor** — receipt hashes and task outcomes that reputation is computed from.

## Data flow

```
  register / discover            sendTask / result + receipt
 ┌──────────────────┐          ┌──────────────────────────────┐
 │                  ▼          ▼                              │
 │            ┌──────────┐  signed task   ┌──────────┐        │
 │      ┌────▶│ Awel node│                │ Agent B  │        │
 │      │     │ registry │◀── anchor ─────│ (worker) │        │
 │      │     │ discovery│    receipt     └─────┬────┘        │
 │ ┌────┴───┐ │ anchor   │                      │             │
 │ │Agent A │ └──────────┘                      │ execute     │
 │ │(req.)  │◀──── result + signed receipt ─────┘             │
 │ └───┬────┘                                                 │
 │     │         pay (x402) / open+settle channel (MPP)       │
 │     └──────────────────────┬──────────────────────────────┘
 │                            ▼
 │                     ┌─────────────┐
 └────────────────────▶│   Solana    │  USDC escrow / channels / anchor
                       └─────────────┘
```

Two distinct planes:

- **Control plane** (agent ↔ node): registration, discovery, receipt anchoring. Low-value,
  censorship-resistant via federation.
- **Value plane** (agent ↔ agent ↔ Solana): task envelopes, results, receipts, payments.
  The node is *not* on this path.

## Task lifecycle

A task moves through a fixed sequence. States are normatively defined in
[RFC-0001](../spec/RFC-0001-task-protocol.md); payment steps in
[RFC-0002](../spec/RFC-0002-payments.md).

```
 discover ─▶ pay / escrow ─▶ queue ─▶ execute ─▶ result + receipt ─▶ settle
```

1. **Discover.** Requester calls `findAgents({ capability, maxPriceUsdc, minReputation })`.
   The node returns candidate workers ranked by price and reputation. Requester picks one.

2. **Pay / escrow.** Requester sends a signed task envelope. The worker responds with a
   payment requirement:
   - **x402:** worker returns `402 Payment Required` with a challenge. Requester escrows USDC
     (or pays directly) and retries with a payment proof.
   - **MPP:** if a channel to this worker is open, the requester attaches a signed channel
     update. If not, it opens one first. The channel balance is the escrow.

3. **Queue.** Worker validates identity, signature, nonce/expiry, and payment proof, then
   accepts the task into its queue. State → `queued`.

4. **Execute.** Worker runs the task. State → `running`. The requester polls (`getTask`) or
   subscribes to a stream for progress.

5. **Result + receipt.** Worker produces output and a receipt committing to: the task hash,
   the output hash, the amount, and the prior receipt in the worker's chain. Worker signs the
   receipt; requester counter-signs on acceptance. State → `complete` (or `failed`).

6. **Settle.** Payment finalizes:
   - **x402:** escrow releases to the worker; any unspent portion refunds to the requester on
     partial/failed completion.
   - **MPP:** the channel continues. Funds settle on-chain only when the channel is closed,
     using the latest signed state.

   The receipt hash is anchored, feeding the reputation layer.

### State machine

```
            ┌─────────┐  accept   ┌─────────┐  finish  ┌──────────┐
 envelope ─▶│ queued  │ ────────▶ │ running │ ───────▶ │ complete │
            └────┬────┘           └────┬────┘          └──────────┘
                 │ reject/expire       │ error
                 ▼                     ▼
            ┌─────────┐           ┌─────────┐
            │ failed  │◀──────────│ failed  │
            └─────────┘           └─────────┘
```

`failed` is terminal and triggers refund (x402) or channel reconciliation (MPP), and may
trigger a dispute that affects reputation per [RFC-0003](../spec/RFC-0003-reputation.md).

## Delegation & multi-agent workflows

A worker may itself act as a requester, fanning a task out to sub-agents via `delegate()`.
Delegated tasks form a tree; each edge carries its own task envelope, payment, and receipt.
Receipts hash-link to the parent task, so an entire workflow is independently verifiable end
to end. See [RFC-0001 §4](../spec/RFC-0001-task-protocol.md) for delegation semantics.

## Failure & recovery

| Failure | Effect | Recovery |
|---------|--------|----------|
| Node offline | Discovery/anchoring unavailable | Use a federated node; cached registry still works |
| Worker crashes mid-task | Task stuck in `running` | Expiry → `failed` → refund / channel reconcile |
| Disputed result | Task ruled against a party | Slashing + reputation update (RFC-0003) |
| Channel counterparty vanishes | Funds locked | Unilateral close with latest signed state after dispute window |
| Receipt withheld | No proof of completion | Requester escrow does not release; reputation penalty for worker |

<!-- maint: chore(ci): cache node_modules in workflow (2026-06-16) -->

<!-- maint: test(reputation): add tombstone edge case (2026-06-16) -->

<!-- maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16) -->

<!-- maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16) -->

<!-- maint: chore: bump dev deps (2026-06-16) -->

<!-- maint: feat(sdk): re-land discovery filter with stable ordering (2026-06-16) -->

<!-- maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16) -->

<!-- maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16) -->

<!-- maint: chore: bump dev deps (2026-06-16) -->

<!-- maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16) -->

<!-- maint: chore(ci): cache node_modules in workflow (2026-06-16) -->

<!-- maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16) -->

<!-- maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16) -->

<!-- maint: docs: expand architecture data-flow notes (2026-06-16) -->

<!-- maint: docs: add delegate() example to quickstart (2026-06-16) -->

<!-- maint: chore: bump dev deps (2026-06-16) -->

<!-- maint: docs: add delegate() example to quickstart (2026-06-16) -->

<!-- maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16) -->

<!-- maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16) -->

<!-- maint: perf(reputation): avoid re-sort on getActiveAgents (2026-06-16) -->

<!-- maint: docs(spec): note MPP unilateral-close dispute window (2026-06-16) -->

<!-- maint: test(sdk): typed envelope round-trip (2026-06-16) -->

<!-- maint: test(sdk): typed envelope round-trip (2026-06-16) -->
