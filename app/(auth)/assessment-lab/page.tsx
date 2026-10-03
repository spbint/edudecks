import Link from "next/link";
import { getTrustedAssetProofAccess } from "@/lib/clean/assessments/trusted-asset-proof/access.server";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import AssessmentLabWorkspace from "@/app/components/clean/assessment-lab/AssessmentLabWorkspace";

export const metadata = {
  title: "Assessment Lab | MyLearna",
};

export default async function AssessmentLabPage() {
  const proofAccess = await getTrustedAssetProofAccess();
  return (
    <AssessmentAccessGate mode="lab">
      {proofAccess.allowed ? (
        <nav
          aria-label="Internal assessment proofs"
          style={{ padding: "16px 24px", display: "flex", gap: 18, flexWrap: "wrap" }}
        >
          <Link href="/assessment-lab/assets-proof" prefetch={false}>
            Open the six-asset trusted-diagram proof
          </Link>
          <Link href="/assessment-lab/placement-simulator" prefetch={false}>
            Open the Number & Operations anchor-routing simulator
          </Link>
          <Link href="/assessment-lab/item-review" prefetch={false}>
            Open the trusted item & visual review lab
          </Link>
          <Link href="/assessment-lab/numeracy-spine" prefetch={false}>
            Open the complete numeracy progression spine
          </Link>
          <Link href="/assessment-lab/measurement-units" prefetch={false}>
            Open the Measurement units cross-strand proof
          </Link>
        </nav>
      ) : null}
      <AssessmentLabWorkspace />
    </AssessmentAccessGate>
  );
}
