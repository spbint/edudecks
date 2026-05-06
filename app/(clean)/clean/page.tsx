import Link from "next/link";

const shellStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle = {
  maxWidth: 880,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

const listStyle = {
  margin: 0,
  paddingLeft: 20,
  display: "grid",
  gap: 8,
};

const linkStyle = {
  color: "#1d4ed8",
  textDecoration: "none",
  fontWeight: 600,
};

const previewRoutes = [
  { href: "/clean-my-day", label: "My Day" },
  { href: "/clean-my-calendar", label: "My Calendar" },
  { href: "/clean-my-programs", label: "My Programs" },
  { href: "/clean-my-capture", label: "My Capture" },
  { href: "/clean-my-portfolio", label: "My Portfolio" },
  { href: "/clean-my-reports", label: "My Reports" },
  { href: "/clean-my-outputs", label: "My Outputs" },
];

const cleanBackedRoutes = [
  { href: "/my-profile", label: "My Profile" },
  { href: "/my-settings", label: "My Settings" },
];

export default function CleanPreviewHubPage() {
  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#64748b",
                textTransform: "uppercase",
              }}
            >
              Clean rebuild preview
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>MyLearna clean hub</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              This is the clean rebuild preview. Not yet production.
            </p>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Use this page as a manual launch point while the old app stays active and navigation remains unchanged.
            </p>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Clean preview routes</h2>
          <ul style={listStyle}>
            {previewRoutes.map((route) => (
              <li key={route.href}>
                <Link href={route.href} style={linkStyle}>
                  {route.label}
                </Link>
                <span style={{ color: "#64748b" }}> - {route.href}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Clean-backed foundation routes</h2>
          <ul style={listStyle}>
            {cleanBackedRoutes.map((route) => (
              <li key={route.href}>
                <Link href={route.href} style={linkStyle}>
                  {route.label}
                </Link>
                <span style={{ color: "#64748b" }}> - {route.href}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
