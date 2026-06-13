import Link from "next/link";
import ActivityPlayerV4 from "@/app/components/clean/activity-player-v4/ActivityPlayerV4";
import { buildActivityPlayerV4Samples } from "@/app/components/clean/activity-player-v4/activityPlayerV4Samples";

export const metadata = {
  title: "Activity Player V4 Lab | MyLearna",
  robots: {
    index: false,
    follow: false,
  },
};

function ProductionGuard() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F7F9FC",
        color: "#17204B",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          maxWidth: 560,
          border: "1px solid #E7EAF2",
          borderRadius: 22,
          background: "#FFFFFF",
          padding: 24,
          display: "grid",
          gap: 12,
          boxShadow: "0 14px 36px rgba(23,32,75,0.065)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Activity Player V4 lab is not available here</h1>
        <p style={{ margin: 0, color: "#5B6478", lineHeight: 1.6 }}>
          Use the signed-in preview route for deployed review.
        </p>
        <Link href="/my-pathways/activity-player-v4-preview" style={{ color: "#6C4DF6", fontWeight: 650 }}>
          Open Activity Player V4 preview
        </Link>
      </section>
    </main>
  );
}

export default function ActivityPlayerV4LabPage() {
  if (process.env.NODE_ENV === "production") {
    return <ProductionGuard />;
  }

  return <ActivityPlayerV4 samples={buildActivityPlayerV4Samples()} />;
}
