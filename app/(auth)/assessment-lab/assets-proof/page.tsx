import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AssessmentAccessGate from "@/app/components/clean/assessment-lab/AssessmentAccessGate";
import TrustedAssetProof from "@/app/components/clean/assessment-lab/TrustedAssetProof";
import { getTrustedAssetProofAccess } from "@/lib/clean/assessments/trusted-asset-proof/access.server";

export const metadata = {
  title: "Trusted Asset Proof | MyLearna Assessment Lab",
  robots: { index: false, follow: false, noarchive: true },
};
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrustedAssetProofPage() {
  const access = await getTrustedAssetProofAccess();
  if (!access.allowed) {
    if (access.status === 401) redirect("/login?next=%2Fassessment-lab%2Fassets-proof");
    notFound();
  }
  const { getTrustedAssetProofItems } = await import("@/lib/clean/assessments/trusted-asset-proof/catalogue.server");
  return (
    <AssessmentAccessGate mode="lab">
      <nav aria-label="Assessment Lab navigation" style={{ padding: "12px 20px" }}>
        <Link href="/assessment-lab" prefetch={false}>Back to Assessment Lab</Link>
      </nav>
      <TrustedAssetProof items={getTrustedAssetProofItems()} />
    </AssessmentAccessGate>
  );
}
