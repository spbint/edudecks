import Link from "next/link";

export default function MyReviewPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f9fc",
        padding: "48px 20px",
      }}
    >
      <section
        style={{
          maxWidth: 720,
          margin: "0 auto",
          border: "1px solid #e7eaf2",
          borderRadius: 24,
          background: "#ffffff",
          padding: 28,
          boxShadow: "0 14px 36px rgba(15,23,42,0.08)",
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            color: "#6c4df6",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          MyLearna
        </p>
        <h1 style={{ margin: 0, color: "#17204b", fontSize: 32 }}>
          This feature is not available in this account
        </h1>
        <p style={{ margin: "14px 0 0", color: "#5b6478", lineHeight: 1.7 }}>
          Use My Day to continue with planned learning, capture evidence, and keep
          the pathway moving.
        </p>
        <div style={{ marginTop: 22 }}>
          <Link
            href="/my-day"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              borderRadius: 999,
              background: "#17204b",
              color: "#ffffff",
              padding: "0 18px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Go to My Day
          </Link>
        </div>
      </section>
    </main>
  );
}
