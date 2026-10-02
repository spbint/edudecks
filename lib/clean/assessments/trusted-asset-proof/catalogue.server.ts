import "server-only";
import { createHash } from "node:crypto";
import sourceItems from "./items.generated.json";
import assetBytes from "./assetBytes.generated.json";
import type { ProofItem } from "./types";

/** Only import this module on the server after the staff gate succeeds. */
export function getTrustedAssetProofItems(): readonly ProofItem[] {
  return sourceItems as readonly ProofItem[];
}

export function getTrustedAssetProofFile(fileName: string) {
  // An exact allowlist, not a filesystem lookup or user-controlled URL fetch.
  if (!Object.prototype.hasOwnProperty.call(assetBytes, fileName)) return null;
  const asset = assetBytes[fileName as keyof typeof assetBytes];
  const bytes = Buffer.from(asset.base64, "base64");
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (bytes.byteLength !== asset.byteLength || actual !== asset.sha256) {
    throw new Error("Assessment proof asset integrity check failed.");
  }
  return { bytes: new Uint8Array(bytes), mimeType: asset.mimeType, sha256: actual };
}
