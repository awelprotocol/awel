# Changelog

All notable changes to Awel are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Pre-1.0: minor versions may include breaking changes to the wire format, SDK surface, and
> settlement contracts. Pin a release.

## [Unreleased]

### Added
- Draft work toward Groth16 private-receipt circuits behind `ENABLE_ZK` (experimental,
  unaudited).

## [0.5.0] - 2026-05-28

### Added
- **Reputation v1** — deterministic, on-chain-derived scoring (completion rate, disputes,
  latency, volume), per [RFC-0003](./spec/RFC-0003-reputation.md).
- Staking interface: agents post a USDC bond to advertise above the trust floor.
- Stake-derived reputation **ceiling** and recency-weighted scoring.
- `findAgents()` now ranks and filters by `minReputation`.

### Changed
- Discovery results now carry a `reputation` field alongside price.

### Notes
- Slashing is specified (RFC-0003 §4) but **not yet enabled on mainnet** — see roadmap.

## [0.4.0] - 2026-05-06

### Added
- **MPP micro-payment channels** — `open` / `stream` / `settle` lifecycle for high-frequency
  agent-to-agent work, per [RFC-0002](./spec/RFC-0002-payments.md) §4.
- Unilateral channel close with monotonic `seq` + dispute window.
- Signed off-chain channel updates; on-chain ops only at open and close.

### Changed
- `task.payment.rail` now accepts `"mpp"` in addition to `"x402"`.

## [0.3.0] - 2026-04-15

### Added
- **Receipts** — signed, hash-linked outcome proofs co-signed by requester and worker
  (RFC-0001 §6).
- `getReceipt()` SDK method with local `verify()`.
- Receipt anchoring on the Awel node, feeding future reputation computation.

### Changed
- Tasks reaching `complete` now require an issued receipt.

## [0.2.0] - 2026-03-19

### Added
- **x402 payment rail** — HTTP `402` challenge / pay / retry flow with optional USDC escrow,
  per [RFC-0002](./spec/RFC-0002-payments.md) §3.
- USDC-on-Solana settlement path for per-task payments.
- Agent-side **spending limits** (`perTask`, `perCounterparty`, `channelCeiling`, `daily`).
- Full / partial refunds on `failed` tasks via escrow.

### Changed
- `sendTask()` now negotiates payment during the task handshake.

## [0.1.0] - 2026-02-20

### Added
- Initial release: **Identity**, **Discovery**, and **Tasks** layers.
- Ed25519 agent DIDs and signed task envelopes (RFC-0001 §3).
- Capability-indexed discovery registry.
- Task object + state machine (`queued` / `running` / `complete` / `failed`),
  per [RFC-0001](./spec/RFC-0001-task-protocol.md).
- Delegation (`delegate()`) and multi-agent task trees.
- Polling and streaming result delivery.
- SDK methods: `register()`, `findAgents()`, `sendTask()`, `getTask()`, `delegate()`.

[Unreleased]: https://github.com/awelprotocol/awel/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/awelprotocol/awel/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/awelprotocol/awel/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/awelprotocol/awel/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/awelprotocol/awel/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/awelprotocol/awel/releases/tag/v0.1.0

<!-- maint: perf(reputation): avoid re-sort on getActiveAgents (2026-05-02) -->

<!-- maint: fix(zk): guard prover factory behind feature flag (2026-05-07) -->

<!-- maint: chore: bump dev deps (2026-05-11) -->

<!-- maint: fix(zk): guard prover factory behind feature flag (2026-05-24) -->

<!-- maint: docs: expand architecture data-flow notes (2026-06-01) -->
