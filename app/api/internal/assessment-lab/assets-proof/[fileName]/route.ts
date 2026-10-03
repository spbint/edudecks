import { getTrustedAssetProofAccess } from "@/lib/clean/assessments/trusted-asset-proof/access.server";
import { proofResponseHeaders, proofUnavailable } from "@/lib/clean/assessments/trusted-asset-proof/response.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> },
) {
  const access = await getTrustedAssetProofAccess();
  if (!access.allowed) return proofUnavailable(access.status);
  try {
    // Do not ship the source data in a publicly importable client bundle.
    const { getTrustedAssetProofFile } = await import("@/lib/clean/assessments/trusted-asset-proof/catalogue.server");
    const { fileName } = await context.params;
    const file = getTrustedAssetProofFile(fileName);
    if (!file) return proofUnavailable(404);
    return new Response(file.bytes, { headers: {
      ...proofResponseHeaders(file.mimeType),
      "Content-Length": String(file.bytes.byteLength),
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-MyLearna-Asset-Sha256": file.sha256,
    } });
  } catch {
    return proofUnavailable(503);
  }
}
