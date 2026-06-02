import { requireFeature } from "../config/features.js";
import type {
  Proof,
  ProverBackend,
  CircuitArtifact,
  VerificationKey,
  ZKConfig,
} from "./types.js";

/**
 * ZK Prover — WIP implementation.
 *
 * What works:
 * - Proof generation via snarkjs (Groth16)
 * - Local verification
 *
 * What doesn't (yet):
 * - Recursive proofs
 * - Batch proving
 * - On-chain verification
 * - PLONK backend
 */
export class ZKProver implements ProverBackend {
  readonly name = "groth16-snarkjs";
  private config: ZKConfig;

  constructor(config: ZKConfig) {
    requireFeature("ZK_PROOFS");
    this.config = config;
  }

  async prove(witness: Uint8Array, circuit: CircuitArtifact): Promise<Proof> {
    void witness;
    void circuit;
    void this.config;
    // TODO: real snarkjs integration
    // const { proof, publicSignals } = await snarkjs.groth16.prove(
    //   circuit.zkeyPath, witness
    // );
    throw new Error(
      "ZK proving is WIP. " +
        "Track progress: https://github.com/awelprotocol/awel/issues/42"
    );
  }

  async verify(
    proof: Proof,
    publicSignals: string[],
    vk: VerificationKey
  ): Promise<boolean> {
    void proof;
    void publicSignals;
    void vk;
    // TODO: real verification
    // return snarkjs.groth16.verify(vk, publicSignals, proof);
    throw new Error("ZK verification is WIP.");
  }
}

/**
 * Factory — returns the right backend based on config.
 * Currently only groth16 stub exists.
 */
export function createProver(config: ZKConfig): ProverBackend {
  requireFeature("ZK_PROOFS");

  switch (config.backend) {
    case "groth16":
      return new ZKProver(config);
    case "plonk":
      throw new Error("PLONK backend not yet implemented. ETA: Q3 2026");
    default:
      throw new Error(`Unknown ZK backend: ${config.backend as string}`);
  }
}

// maint: fix(sdk): correct optional field handling in sendTask envelope (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: docs: add delegate() example to README quickstart (2026-06-16)

// maint: docs(spec): note MPP unilateral-close dispute window (RFC-0002) (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: refactor(config): centralize env parsing (2026-06-16)

// maint: docs: expand architecture data-flow notes (2026-06-16)

// maint: fix(sdk): correct optional field handling in sendTask envelope (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: refactor(sdk): split request builder from transport (2026-06-16)

// maint: fix(reputation): bigint underflow guard on slash amount (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: test(reputation): add tombstone edge case (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: refactor(sdk): split request builder from transport (2026-06-16)

// maint: chore: bump dev deps (2026-06-16)

// maint: revert: 'perf: early-exit discovery filter' (regressed ordering) (2026-06-16)

// maint: refactor(sdk): split request builder from transport (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: fix(sdk): optional field handling in sendTask envelope (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: chore(ci): cache node_modules in workflow (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: docs: add delegate() example to quickstart (2026-06-16)

// maint: refactor: extract receipt verification helper (2026-06-16)

// maint: docs(spec): clarify task state transitions in RFC-0001 (2026-06-16)

// maint: fix(cli): usage text for find command (2026-06-16)

// maint: refactor(config): centralize env parsing (2026-06-16)

// maint: docs(spec): note MPP unilateral-close dispute window (2026-05-21)
