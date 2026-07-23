import Link from "next/link";

const shellStyle = {
  minHeight: "auto",
  background: "transparent",
  padding: 0,
};

const wrapStyle = {
  maxWidth: 880,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle = {
  border: "1px solid #E7EAF2",
  borderRadius: 20,
  background: "#ffffff",
  padding: "clamp(16px, 3vw, 22px)",
  boxShadow: "0 8px 24px rgba(23,32,75,0.06)",
};

const listStyle = {
  margin: 0,
  paddingLeft: 20,
  display: "grid",
  gap: 8,
};

const linkStyle = {
  color: "#6C4DF6",
  textDecoration: "none",
  fontWeight: 600,
};

const previewRoutes = [
  { href: "/my-day", label: "My Day" },
  { href: "/my-pathways", label: "My Pathways" },
  { href: "/my-assessments", label: "My Assessments" },
  { href: "/my-capture", label: "My Capture" },
  { href: "/my-portfolio", label: "My Portfolio" },
  { href: "/my-learna", label: "My Learna" },
  { href: "/my-reports", label: "My Reports" },
  { href: "/my-settings", label: "My Settings" },
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
                letterSpacing: "0.04em",
                color: "#6C4DF6",
                textTransform: "uppercase",
              }}
            >
              MyLearna
            </div>
            <h1 style={{ margin: 0, fontSize: 28, color: "#17204B" }}>App hub</h1>
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              Use the sidebar for the main family workspace, or open a section below.
            </p>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, color: "#17204B" }}>Workspace sections</h2>
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
          <h2 style={{ marginTop: 0, color: "#17204B" }}>Profile and setup</h2>
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
