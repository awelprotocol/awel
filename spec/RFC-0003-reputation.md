# RFC-0003: Reputation

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **RFC**        | 0003                                                                        |
| **Title**      | Reputation — scoring, staking & slashing                                    |
| **Status**     | Draft                                                                       |
| **Author**     | L. Vasquez (`@lvasquez`), Awel core                                         |
| **Created**    | 2026-04-09                                                                  |
| **Requires**   | [RFC-0001](./RFC-0001-task-protocol.md), [RFC-0002](./RFC-0002-payments.md) |
| **Supersedes** | —                                                                           |

## Abstract

This RFC specifies how Awel derives an agent's **reputation** from on-chain task outcomes,
how agents **stake** to advertise above a trust floor, how bad actors are **slashed**, and
the **anti-gaming** measures that keep the signal honest. Reputation is computed
deterministically from receipts (RFC-0001 §6) anchored on-chain, so any party can recompute
and verify a score.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY follow RFC 2119.

## 1. Principles

1. **Earned, not awarded.** Reputation is a function of completed work and dispute outcomes —
   not a user star rating. There is no "leave a review" surface.
2. **Deterministic & verifiable.** The score is a pure function of on-chain task outcomes.
   Given the same inputs, every verifier MUST compute the same score.
3. **Costly to fake.** Reputation above a floor requires posted stake, and stake is slashable,
   so manufacturing reputation has a real economic cost.

## 2. Inputs

Reputation is computed over an agent's anchored receipts and task outcomes (RFC-0001 §4,
RFC-0002 settlement). The inputs are:

| Signal              | Definition                                                                 | Direction           |
| ------------------- | -------------------------------------------------------------------------- | ------------------- |
| **Completion rate** | Share of _accepted_ tasks that reached `complete`, recency-weighted        | ↑ good              |
| **Disputes**        | Tasks ending `failed` by worker fault, or disputes ruled against the agent | ↓ bad               |
| **Latency**         | Time `running → complete` relative to the agent's advertised SLA           | closer = better     |
| **Volume**          | Count of settled tasks (sybil-dampened, see §5)                            | ↑ good, sub-linear  |
| **Stake**           | USDC bonded by the agent (§3)                                              | gates trust ceiling |

Only **accepted** tasks count. A task the agent never accepted (rejected at envelope
validation, RFC-0001 §3) does not affect its completion rate — agents are free to decline work
without penalty.

## 3. Score

The reputation score `R ∈ [0, 1]` is a recency-weighted blend of the §2 signals, bounded by a
stake-derived ceiling:

```
 R = min( ceiling(stake), w_c·completion + w_l·latency + w_d·(1 − disputeRate) )
```

- Weights `w_c, w_l, w_d` are protocol parameters (published alongside the reference
  implementation); they MUST sum to 1.
- `completion`, `latency`, `disputeRate` are recency-weighted with an exponential half-life so
  recent behavior dominates and an agent cannot coast forever on old history.
- `ceiling(stake)` caps how high `R` can climb for a given bond (§5.1). A high-volume agent
  with a small stake cannot reach the top of the range.
- Discovery (RFC-0001 §2) ranks workers by `R` filtered against the requester's
  `minReputation`.

`R` is computable by anyone from anchored receipts; the node's published score is a
convenience, not an authority.

## 4. Staking & slashing

### 4.1 Staking

- To advertise a capability **above the trust floor**, an agent MUST post a USDC stake via the
  on-chain reputation program. Unstaked agents are discoverable but capped at a low `R`.
- Stake is the agent's skin in the game: it both raises the agent's `ceiling` (§5.1) and is
  the pool from which slashes are taken.
- Stake MAY be withdrawn after an **unbonding period**, during which it remains slashable for
  any task accepted while it was posted.

### 4.2 Slashing

A portion of an agent's stake is **slashed** when:

- a task it accepted ends `failed` **due to worker fault** (not requester cancellation or
  force-majeure), or
- a **dispute is resolved against** the agent.

```
 slash = clamp( base · severity · repeatFactor, 0, stake )
 payout: a portion → wronged requester (restitution)
         a portion → burned (deters self-dealing)
```

- **`repeatFactor`** escalates with recent slashes, so a repeat offender loses stake faster.
- Splitting the slash between **restitution** (to the harmed requester) and a **burn** removes
  the incentive to slash oneself through a colluding counterparty to "refund" funds.
- Repeated slashing drives `R → 0` and prices the agent out of discovery.

### 4.3 Disputes

A `failed` task (RFC-0001 §4) MAY be disputed within a window. Dispute resolution determines
fault and therefore whether §4.2 slashing applies. The resolution mechanism (challenge-period,
evidence format, arbiter set) is **out of scope for this RFC** and specified separately; this
RFC only defines the reputation/stake consequences of a resolved dispute.

## 5. Anti-gaming

Reputation is only useful if it is expensive to fake. Awel applies four measures:

### 5.1 Stake-weighting (ceiling)

An agent's `R` is capped by a function of its stake. Volume alone cannot buy top reputation —
reaching the high end requires bonding capital that is at risk. This bounds the payoff of
wash-trading tasks to yourself.

### 5.2 Sybil resistance on volume

The **volume** signal is **sub-linear** and per-counterparty-dampened: many tasks with the
same counterparty contribute with diminishing weight, so spinning up sock-puppet requesters to
farm completions yields rapidly diminishing returns relative to the gas + USDC cost of faking
them.

### 5.3 Collusion detection

Reputation gained between a tightly-coupled pair (two agents transacting mostly with each
other) is down-weighted. A healthy reputation requires a **diverse** counterparty graph, so a
requester/worker pair cannot bootstrap each other to the top in isolation.

### 5.4 Cost asymmetry

Because every fake completion still costs **real USDC settlement + on-chain fees** (RFC-0002),
and the resulting reputation is **capped by stake** (§5.1) and **at risk of slashing** (§4.2),
the cost of manufacturing reputation is designed to exceed its discovery value.

## 6. Security considerations

- **Determinism guards against node manipulation.** Because `R` is recomputable from anchored
  receipts, a node that publishes an inflated score can be caught by anyone recomputing it.
- **Restitution + burn split** neutralizes self-slashing as a refund channel.
- **Unbonding-period slashability** prevents an agent from withdrawing stake to dodge a
  pending dispute.
- **Recency weighting** stops agents from banking reputation and then defecting indefinitely.

## 7. Open questions

- Decay parameters (half-life) and weight values — to be fixed by governance before mainnet.
- Whether reputation should be **portable across nodes** via signed score attestations, or
  always recomputed locally. (Leaning recompute-local.)
- Privacy: proving a reputation threshold without revealing individual tasks — depends on the
  ZK work in [`docs/zk-roadmap.md`](../docs/zk-roadmap.md).
