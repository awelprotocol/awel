# Contributing to Awel

Thanks for your interest in Awel. Awel is **spec-first and RFC-driven**: protocol changes
start as an RFC before any code lands. This guide covers the branch strategy, commit
conventions, and PR rules.

## Before you start

- For a **protocol change** (anything touching the wire format, task object, payment rails,
  reputation, or settlement), open an RFC in [`/spec`](./spec) **first**. Implementation PRs
  reference the RFC they implement.
- For a **bug fix or non-protocol change**, open an issue describing the problem before
  sending a large PR.
- For **security issues**, do **not** open an issue or PR — follow [`SECURITY.md`](./SECURITY.md).

## Branch strategy

We use a three-tier branch model:

| Branch | Purpose | Protected |
|--------|---------|-----------|
| `main` | Released, tagged code. Always deployable. | ✅ |
| `develop` | Integration branch for the next release. | ✅ |
| `feat/*`, `fix/*`, `docs/*`, `rfc/*` | Topic branches off `develop`. | — |

- Branch off `develop`, not `main`.
- Name branches by type: `feat/mpp-streaming`, `fix/x402-nonce-replay`, `docs/architecture`,
  `rfc/0004-disputes`.
- PRs target `develop`. `develop → main` happens at release time with a version tag.
- Hotfixes for a shipped release may branch from `main` as `fix/*` and merge to both `main`
  and `develop`.

## Commits — Conventional Commits

All commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`, `spec`.

**Examples:**

```
feat(payments): add MPP unilateral close with dispute window
fix(tasks): reject delegated task whose parent chain contains worker DID
spec(rfc-0003): clarify stake-derived reputation ceiling
docs(architecture): document control vs value plane
```

- Use `spec` type for RFC changes; scope it to the RFC (`spec(rfc-0002)`).
- Breaking changes MUST include `BREAKING CHANGE:` in the footer (and pre-1.0 still warrant a
  minor-version bump).
- Keep the subject ≤ 72 chars, imperative mood, no trailing period.

## Pull request rules

A PR is mergeable when:

1. **It targets `develop`** (or `main` for a hotfix).
2. **CI is green** — typecheck (TS `strict`), lint, unit + conformance tests all pass.
3. **It references an RFC** if it changes protocol behavior, or an issue otherwise.
4. **It has tests** — new behavior ships with tests; bug fixes ship with a regression test.
5. **It updates docs** — if it changes the SDK surface or protocol, update the relevant `/spec`
   RFC, `/docs`, and the README.
6. **It updates the changelog** — add an entry under `[Unreleased]` in
   [`CHANGELOG.md`](./CHANGELOG.md).
7. **It has at least one approving review** from a maintainer.
8. **Commits are conventional** and history is reasonably clean (squash or rebase as needed).

PRs that touch payments, settlement, or slashing logic require review from a maintainer
familiar with the on-chain components.

## Local development

```bash
npm install
npm run build      # tsc --strict
npm run lint
npm test           # unit + conformance suite
```

All three SDKs (TS / Rust / Python) share a **conformance suite** generated from the RFCs.
A protocol change is not complete until the conformance suite is updated and all SDKs pass it.

## Code style

- TypeScript: `strict` mode, no `any` without justification, no implicit `any`.
- Prefer explicit, verifiable code in the signing / payment paths over cleverness.
- No backwards-compatibility shims pre-1.0 — change the thing and bump the version.

## License

By contributing, you agree your contributions are licensed under the
[Apache License 2.0](./LICENSE).
