import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminShell from "../components/AdminShell";

export default async function ReportingIntelligenceVerificationPage() {
  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Reporting intelligence verification"
          subtitle="Temporarily unavailable"
          backHref="/admin"
        >
          <div className="dash-alert">
            Reporting intelligence verification is temporarily unavailable during rebuild.
          </div>
        </AdminShell>
      </div>
    </div>
  );
}
