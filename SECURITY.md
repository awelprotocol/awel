# Security Policy

Awel handles identity keys, payment authorization, and on-chain settlement. We take security
seriously and appreciate responsible disclosure.

> Awel is **pre-1.0 and experimental**. No external audit has been completed; an external
> audit is planned for **Q3 2026** (see the audit status table in the README). Until then,
> treat all on-chain components as unaudited.

## Reporting a vulnerability

**Do not open a public issue, PR, or Discord message for security vulnerabilities.**

Email **security@awel.dev** with:

- A description of the vulnerability and its impact.
- Steps to reproduce (PoC appreciated).
- Affected version(s) / commit hash.
- Any suggested remediation.

If you need to encrypt, request our PGP key in your first (non-sensitive) email and we will
reply with it.

### What to expect

| Stage | Target |
|-------|--------|
| Acknowledgement of report | within **48 hours** |
| Initial severity assessment | within **5 business days** |
| Fix or mitigation plan | depends on severity; critical issues prioritized immediately |
| Public disclosure | coordinated with the reporter after a fix ships |

We practice coordinated disclosure. We will credit you in the advisory unless you prefer to
remain anonymous. We do not currently run a paid bug-bounty program; this may change after the
Q3 2026 audit.

## Supported versions

Security fixes are backported to the versions below. Pre-1.0, only the latest minor receives
guaranteed fixes — pin a release and upgrade promptly.

| Version | Supported |
|---------|-----------|
| `0.5.x` | ✅ Yes (current) |
| `0.4.x` | ⚠️ Critical fixes only |
| `0.3.x` | ❌ No |
| `< 0.3` | ❌ No |

## Scope

**In scope:**

- The `@awel/sdk` TypeScript SDK and the Rust / Python SDKs.
- The task / receipt protocol and envelope signing ([RFC-0001](./spec/RFC-0001-task-protocol.md)).
- Payment handshake, x402 flow, and MPP channel logic ([RFC-0002](./spec/RFC-0002-payments.md)).
- Reputation, staking, and slashing logic ([RFC-0003](./spec/RFC-0003-reputation.md)).
- The Awel node (identity registry, discovery, receipt anchor).
- On-chain settlement / channel programs.

**Out of scope:**

- Experimental ZK circuits behind `ENABLE_ZK` (known-incomplete, unaudited — see
  [`docs/zk-roadmap.md`](./docs/zk-roadmap.md)). Report findings, but they are not eligible for
  coordinated-disclosure SLAs until the feature is stabilized.
- Vulnerabilities requiring a compromised agent host or stolen identity/wallet keys — key
  custody on the agent host is the operator's responsibility.
- Denial of service against a single self-hosted node (run federated nodes for availability).
- Issues in third-party dependencies without a demonstrated impact on Awel.
- Social engineering, physical attacks, and spam.

## Hardening guidance for operators

- Store identity and wallet keys in an HSM or secure enclave for high-value agents.
- Configure SDK spending limits (RFC-0002 §6) — `perTask`, `perCounterparty`,
  `channelCeiling`, `daily`.
- Pin an SDK release and the node version; do not track `main` in production.
- Run multiple federated nodes so a single node compromise cannot censor your discovery or
  receipt anchoring.
- Keep `ENABLE_ZK` **off** outside of testing.
