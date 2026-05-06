---
name: Bug report
about: Report a defect in the SDK, CLI, or gateway behavior
title: "[bug] "
labels: ["bug", "triage"]
assignees: []
---

## Description

<!-- A clear, concise description of the bug. -->

## Layer

Which Awel layer is affected?

- [ ] Identity
- [ ] Discovery
- [ ] Payments (x402 / MPP channels / settlement)
- [ ] Tasks
- [ ] Receipts
- [ ] Reputation
- [ ] SDK / CLI

## Reproduction

Steps to reproduce:

1.
2.
3.

Minimal snippet (redact keys and `traces/`):

```ts
import { Awel } from "@awel/sdk";
// ...
```

## Expected vs actual

**Expected:**

**Actual:**

## Environment

- `@awel/sdk` version:
- Gateway version / endpoint (self-hosted or hosted):
- Runtime (Node / Rust / Python) + version:
- OS:

## Logs

<!-- Paste relevant gateway / client output. Scrub signing keys and channel ids. -->
