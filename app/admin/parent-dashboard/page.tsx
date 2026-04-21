import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminShell from "../components/AdminShell";

export default function AdminParentDashboardPage() {
  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Parent dashboard"
          subtitle="Temporarily simplified"
          backHref="/admin"
        >
          <div className="dash-alert">
            Parent dashboard guidance has been simplified during rebuild.
          </div>
        </AdminShell>
      </div>
    </div>
  );
}
