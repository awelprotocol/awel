# ZK Roadmap

Awel is building toward **private receipts**: cryptographic proof that a task was completed
and paid for, _without_ revealing the task input/output or the payment amount, and toward
**reputation rollups** that compress many receipts into a single succinct proof.

This work is **experimental and gated behind the `ENABLE_ZK` feature flag**. It is off by
default, unaudited, and not security-relevant when disabled. Do not enable it in production.

## Goals

1. **Private receipts.** Prove `receipt is valid` (task hash matches, payment occurred,
   signatures verify) while keeping the underlying task and amount confidential.
2. **Verifiable reputation without disclosure.** Let an agent prove "my completion rate is
   ≥ 95% over ≥ 1,000 tasks" without exposing the individual tasks.
3. **Succinct reputation rollups.** Fold a chain of receipts into one recursive proof so a
   verifier checks `O(1)` work instead of replaying every task outcome.

## Timeline

| Phase       | Proof system                       | Scope                                                                                                         | Status         | Gate        |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------- | ----------- |
| **Phase 1** | **Groth16**                        | Receipt-validity circuit (task done + paid). Trusted setup per circuit.                                       | 🟡 **WIP**     | `ENABLE_ZK` |
| **Phase 2** | **PLONK**                          | Universal/updatable setup so circuits can evolve without a new ceremony. Migrate receipt circuit off Groth16. | ⬜ **Planned** | `ENABLE_ZK` |
| **Phase 3** | **Recursive (Nova-style folding)** | Reputation rollups — fold N receipts into one succinct proof. `O(1)` verification of an agent's history.      | ⬜ **Planned** | —           |

## Phase 1 — Groth16 (WIP)

- **What:** A receipt-validity circuit. Public inputs: task hash, worker DID, settlement
  reference. Private witness: task input/output and payment amount. The proof asserts the
  receipt is well-formed and the payment cleared, without revealing the witness.
- **Why Groth16 first:** smallest proofs and cheapest on-chain verification — best fit for
  anchoring receipts on Solana where verification cost matters.
- **Trade-off:** Groth16 needs a **per-circuit trusted setup**. Any change to the circuit
  requires a new ceremony, which is why Phase 2 moves to a universal setup.
- **Status:** circuit and witness generation are in progress behind `ENABLE_ZK`. Not wired
  into the default settlement path. Unaudited.

## Phase 2 — PLONK (planned)

- **What:** Re-express the receipt circuit under PLONK's universal, updatable setup. One
  ceremony covers all circuits up to a size bound; circuit upgrades no longer need a fresh
  ceremony.
- **Why:** removes the per-circuit ceremony bottleneck so private-receipt semantics can
  evolve with the protocol without coordinating a new trusted setup each time.
- **Trade-off:** larger proofs / higher verification cost than Groth16, accepted for the
  flexibility.

## Phase 3 — Recursive proofs (planned)

- **What:** Recursive folding (Nova-style) to aggregate a chain of receipts into a single
  succinct proof of an agent's entire task history.
- **Why:** reputation today is computed by replaying on-chain outcomes. Recursion lets an
  agent present one proof — "here is my verified completion rate over my whole history" —
  that a verifier checks in constant time, enabling private, portable reputation.
- **Dependency:** builds on the Phase 2 circuit set.

## Sequencing & dependencies

```
 Groth16 receipt circuit (WIP)
        │  prove the primitive works on-chain
        ▼
 PLONK universal setup (planned)
        │  make circuits upgradeable
        ▼
 Recursive reputation rollups (planned)
        │  O(1) verification of agent history
        ▼
 Default-on private receipts  ── only after external audit
```

> **No ZK component will be enabled by default before the Q3 2026 external audit.** Until
> then, `ENABLE_ZK` exists solely for development and testing against the experimental
> Groth16 circuit.
