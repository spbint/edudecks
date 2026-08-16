import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FounderCockpit from "@/app/founder/FounderCockpit";
import { FOUNDER_PREVIEW_MOCK_DATA } from "@/app/dev/founder/founderPreviewFixture";

export const metadata: Metadata = {
  title: "Founder Cockpit Local Preview | MyLearna",
  robots: { index: false, follow: false, nocache: true },
};

export default function FounderPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <>
      <div
        role="status"
        style={{
          background: "#fff1ee",
          borderBottom: "1px solid #ffc8be",
          color: "#7c2d24",
          fontSize: 13,
          fontWeight: 800,
          padding: "10px 16px",
          textAlign: "center",
        }}
      >
        Local visual preview - mock data only. No live services are connected.
      </div>
      <FounderCockpit data={FOUNDER_PREVIEW_MOCK_DATA} />
    </>
  );
}

