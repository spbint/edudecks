/** Server gate: opt-in only, preview or explicitly local development; production always denies. */
export type ProofEnvironment = {
  MYLEARNA_ASSESS_ASSET_PROOF?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};
export function isTrustedAssetProofEnabled(env: ProofEnvironment): boolean {
  if (env.MYLEARNA_ASSESS_ASSET_PROOF !== "true") return false;
  if (env.VERCEL_ENV === "preview") return true;
  return !env.VERCEL_ENV && env.NODE_ENV === "development";
}
