/**
 * throughput.bench.ts — task-dispatch throughput harness (stub).
 *
 * Measures how many tasks/sec the SDK can open against a gateway when
 * MPP channels are pre-funded (so settlement is off the hot path). Run
 * against a local gateway, never production.
 *
 * Intended to be driven by `tinybench` (or `node --test` perf hooks):
 *
 *   import { Bench } from "tinybench";
 *   import { Awel } from "@awel/sdk";
 *
 *   const bench = new Bench({ time: 2_000 });
 *   const awel = new Awel({ endpoint: process.env.AWEL_ENDPOINT });
 *   const worker = await awel.register({ name: "bench-echo", capabilities: ["echo"] });
 *
 *   bench
 *     .add("sendTask (warm channel)", async () => {
 *       await awel.sendTask(worker.id, { input: { ping: 1 }, budget: { max: "0.001", currency: "USDC" } });
 *     })
 *     .add("findAgents (cached registry)", async () => {
 *       await awel.findAgents({ capability: "echo" });
 *     });
 *
 *   await bench.warmup();
 *   await bench.run();
 *   console.table(bench.table());
 *
 * Target on reference hardware (1 vCPU gateway, local loopback):
 *   - sendTask:    ~1.8k ops/sec warm
 *   - findAgents:  ~9k ops/sec cached
 *
 * TODO: implement once the SDK transport lands. Keep this commented so the
 * benches/ dir builds clean and `npm test` stays green.
 */

export {};
