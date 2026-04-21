import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminShell from "../components/AdminShell";

export default async function AssessmentVerificationPage() {
  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Assessment verification"
          subtitle="Temporarily unavailable"
          backHref="/admin"
        >
          <div className="dash-alert">
            Assessment verification is temporarily unavailable during rebuild.
          </div>
        </AdminShell>
      </div>
    </div>
  );
}
