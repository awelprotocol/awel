import { createProver } from "../src/zk/prover.js";
import { FEATURES } from "../src/config/features.js";
import type { CircuitArtifact } from "../src/zk/types.js";

describe("ZK Module", () => {
  test("throws when feature flag is off", () => {
    FEATURES.ZK_PROOFS = false;
    expect(() =>
      createProver({ backend: "groth16", circuitsDir: "./circuits" })
    ).toThrow(/not enabled/);
  });

  test("groth16 prover instantiates when flag is on", () => {
    FEATURES.ZK_PROOFS = true;
    const prover = createProver({ backend: "groth16", circuitsDir: "./circuits" });
    expect(prover.name).toBe("groth16-snarkjs");
  });

  test("prove() throws WIP error", async () => {
    FEATURES.ZK_PROOFS = true;
    const prover = createProver({ backend: "groth16", circuitsDir: "./circuits" });
    await expect(
      prover.prove(new Uint8Array(), {} as CircuitArtifact)
    ).rejects.toThrow(/WIP/);
  });

  test("plonk backend not yet available", () => {
    FEATURES.ZK_PROOFS = true;
    expect(() =>
      createProver({ backend: "plonk", circuitsDir: "./circuits" })
    ).toThrow(/not yet implemented/);
  });
});
