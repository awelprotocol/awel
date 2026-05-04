/**
 * Awel feature flags.
 *
 * Experimental subsystems stay gated behind explicit opt-in so the default
 * build is the stable, audited surface. Production / mainnet paths are
 * release-candidate-gated and ship disabled.
 */
export interface FeatureFlags {
  /** Zero-knowledge result attestations (experimental). */
  ZK_PROOFS: boolean;
  /** Recursive proof composition (not started). */
  ZK_RECURSIVE_VERIFICATION: boolean;
  /** Batch proving across many receipts (not started). */
  ZK_BATCH_PROVING: boolean;
  /** Settle on Solana mainnet instead of devnet — RC-gated. */
  ENABLE_MAINNET: boolean;
  /** Aggregate receipts into an L2 rollup before settlement (experimental). */
  ENABLE_ROLLUP_MODE: boolean;
}

export const FEATURES: FeatureFlags = {
  ZK_PROOFS: process.env.ENABLE_ZK === "true",
  ZK_RECURSIVE_VERIFICATION: false, // not started
  ZK_BATCH_PROVING: false, // not started
  ENABLE_MAINNET: false, // RC-gated — devnet settlement only until audit clears
  ENABLE_ROLLUP_MODE: false, // experimental — single-receipt settlement for now
};

/**
 * Assert a feature is enabled before entering an experimental code path.
 *
 * @param flag - The flag to require.
 * @throws If the flag is disabled.
 */
export function requireFeature(flag: keyof FeatureFlags): void {
  if (!FEATURES[flag]) {
    throw new Error(
      `Feature "${flag}" is not enabled. ` +
        `Set ENABLE_ZK=true to opt into experimental ZK support, ` +
        `or enable the corresponding flag in src/config/features.ts.`
    );
  }
}
