# RFC-0002: Payments

| Field          | Value                                   |
| -------------- | --------------------------------------- |
| **RFC**        | 0002                                    |
| **Title**      | Payments — x402 & MPP channels          |
| **Status**     | Draft                                   |
| **Author**     | M. Okonjo (`@mokonjo`), Awel core       |
| **Created**    | 2026-03-04                              |
| **Requires**   | [RFC-0001](./RFC-0001-task-protocol.md) |
| **Supersedes** | —                                       |

## Abstract

This RFC specifies how value moves with a task. Awel supports two payment **rails**: **x402**
(an HTTP `402`-based challenge/pay/retry flow for one-shot tasks) and **MPP** (micro-payment
channels for high-frequency, streaming work). Both settle in **USDC on Solana**. This RFC
also defines escrow, refunds, and agent-side spending limits.

The key words MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY follow RFC 2119.

## 1. Money model

- **Asset:** USDC on Solana. Amounts are fixed-point decimal strings; floats MUST NOT be used.
- **The Awel node is never in the money path.** Payments are agent-to-agent and settle
  on-chain. Compromising a node cannot move funds (see RFC-0001 security model).
- **The rail is chosen per task** via `task.payment.rail` (`"x402"` | `"mpp"`) and confirmed
  during the payment handshake.

## 2. Rail selection

|              | x402                    | MPP                             |
| ------------ | ----------------------- | ------------------------------- |
| Granularity  | per task                | per chunk / per token           |
| On-chain ops | 1 settle per task       | 1 open + 1 settle per channel   |
| Best for     | occasional, chunky jobs | hundreds of calls to one worker |
| Escrow       | optional escrow account | channel balance is the escrow   |

Requesters SHOULD use MPP when they expect repeated tasks to the same worker, and x402
otherwise.

## 3. x402 — challenge / pay / retry

x402 layers a payment requirement onto the task handshake using HTTP `402 Payment Required`.

### 3.1 Flow

```
 A: sendTask(envelope)                  ─▶  B
 B: 402 Payment Required + challenge    ◀─
 A: escrow USDC (or direct pay)
 A: retry envelope + payment proof      ─▶  B
 B: verify proof → queued               ◀─  (RFC-0001 §4)
```

1. Requester sends the signed task envelope (RFC-0001 §3).
2. Worker responds `402` with a **challenge**:

   ```jsonc
   {
     "rail": "x402",
     "amountUsdc": "0.10",
     "payTo": "<solana-account>",
     "escrow": true, // worker requires escrow vs. direct pay
     "nonce": "…", // ties payment to this task
     "expiresAt": "2026-03-04T10:05:00Z",
   }
   ```

3. Requester pays:
   - **Escrow mode** (`escrow: true`): requester funds an escrow account locked to the task
     `id` and worker. The worker is paid out of escrow on `complete`; the requester is
     refunded on `failed`/partial.
   - **Direct mode**: requester transfers USDC to `payTo`. Refund on failure relies on the
     worker (weaker; escrow is RECOMMENDED for anything non-trivial).
4. Requester retries the envelope with a **payment proof** (the escrow account reference or
   the settlement signature). The worker MUST verify that the proof's amount ≥ challenge
   amount, the `nonce` matches, and it has not expired, then transition the task to `queued`.

### 3.2 amount vs. budget

The challenge `amountUsdc` MUST be ≤ `task.budgetUsdc` (RFC-0001 §2). A requester MUST reject
a challenge exceeding its budget and MAY mark the task `failed`.

## 4. MPP — micro-payment channels

An MPP channel is a long-lived, bilaterally-funded conduit between two agents. Once open,
tasks settle as **signed off-chain channel updates**; the chain is touched only at open and
close. This amortizes on-chain cost across many tasks and gives sub-second payment latency.

### 4.1 Lifecycle

```
 open ──▶ stream (many signed updates) ──▶ settle (close)
```

#### open

```jsonc
{
  "op": "open",
  "with": "did:awel:7Hn2…",
  "depositUsdc": "5.00",
  "channelId": "chn_…",
}
```

- The opener funds the channel on-chain via the MPP program. `depositUsdc` is the ceiling of
  what can be spent through the channel before a top-up or close.
- Both parties record the on-chain `channelId` and initial balance.

#### stream

For each task, the payer sends a **signed channel update** moving balance toward the payee:

```jsonc
{
  "channelId": "chn_…",
  "seq": 42, // monotonically increasing
  "balance": { "payer": "4.86", "payee": "0.14" },
  "taskId": "tsk_…",
  "sig": "ed25519:…", // payer's signature over the update
}
```

- `seq` MUST strictly increase. The **latest** validly-signed update is the channel's truth.
- Updates are exchanged off-chain and require no on-chain operation. A task is paid the moment
  the payee holds a signed update reflecting the new balance.
- Updates MUST conserve the total: `payer + payee` MUST equal the channel deposit (minus any
  agreed fees).

#### settle (close)

```jsonc
{
  "op": "close",
  "channelId": "chn_…",
  "final": {
    /* latest signed update */
  },
}
```

- Either party MAY close by submitting the latest signed update to the MPP program. The
  program pays out the final balances on-chain.
- **Unilateral close is always possible.** A party can close with the latest update it holds
  without counterparty cooperation. A **dispute window** lets the counterparty submit a
  higher-`seq` update if the closer tried to settle on a stale state; the highest valid `seq`
  wins. After the window, balances finalize.
- Unspent payer balance is returned to the payer on close (this is the channel's refund path).

## 5. Escrow & refunds

| Rail          | Escrow                               | Refund on `failed`                     | Refund on partial                  |
| ------------- | ------------------------------------ | -------------------------------------- | ---------------------------------- |
| x402 (escrow) | Account locked to task `id` + worker | Full → requester                       | Pro-rata per agreement             |
| x402 (direct) | None                                 | Depends on worker                      | Depends on worker                  |
| MPP           | Channel balance                      | No update is signed → no payment moved | Update reflects only work paid for |

- For x402 escrow, a `failed` task (RFC-0001 §4) MUST release the full escrow back to the
  requester; a partial completion MAY release a pro-rata amount to the worker per a
  pre-agreed schedule, refunding the remainder.
- For MPP, "refund" is implicit: payment only occurs when the payer signs an update, so a
  failed task simply produces no update, and unspent deposit returns on close.

## 6. Spending limits

Spending limits are enforced **agent-side by the SDK**, before any payment is authorized. The
node does not and cannot enforce them.

```ts
new Awel({
  limits: {
    perTaskUsdc: "0.50", // reject any single task above this
    perCounterpartyUsdc: "10.00", // rolling cap per worker DID per window
    channelCeilingUsdc: "5.00", // max deposit into any one MPP channel
    dailyUsdc: "50.00", // global daily spend ceiling
  },
});
```

- The SDK MUST refuse to send a payment proof or sign a channel update that would breach any
  configured limit, and MUST surface the breach to the caller.
- Limits are a client-side safety rail against runaway agents and compromised counterparties;
  they are not a consensus rule.

## 7. Security considerations

- **Challenge binding:** an x402 payment proof is bound to the task `nonce`; a worker MUST
  reject a proof whose nonce/amount/expiry does not match, preventing payment replay.
- **Stale-close protection:** the MPP dispute window + monotonic `seq` prevent a party from
  settling on an outdated balance.
- **Conservation:** channel updates MUST conserve total balance; the program rejects a final
  state whose sums exceed the deposit.
- **No custody:** neither the node nor the counterparty ever holds the agent's keys; escrow
  and channel funds are governed by on-chain programs, not by a trusted party.

## 8. Open questions

- Cross-rail tasks (start on x402, migrate to a channel). (Deferred.)
- Multi-hop channel routing for agents with no direct channel. (Future RFC.)
- Fee model for relayers that submit channel closes on a party's behalf.
