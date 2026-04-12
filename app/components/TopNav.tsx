"use client";

// Dormant B2B component: preserved for older school-facing flows, not for the live family-first product.
export default function TopNav(props: {
  productName: string;
  orgName: string;
  userEmail: string;
  role: string;
  onSignOut: () => void;
}) {
  return (
    <header
      style={{
        display: "flex",
        gap: 12,
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 10,
        borderBottom: "1px solid #eee",
      }}
    >
      <div>
        <div style={{ fontWeight: 900, fontSize: 22 }}>{props.productName}</div>
        <div style={{ opacity: 0.75, marginTop: 2 }}>{props.orgName} • School Dashboard</div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ border: "1px solid #ddd", padding: "6px 10px", borderRadius: 999, fontWeight: 800 }}>
          {props.role}
        </span>
        <span style={{ opacity: 0.75 }}>{props.userEmail}</span>
        <button
          onClick={props.onSignOut}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #bbb" }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
