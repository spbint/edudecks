import Link from "next/link";

type CurriculumSummaryProps = {
  variant?: "card" | "subtle";
  title?: string;
  description?: string;
  helperText?: string;
  linkLabel?: string;
  linkHref?: string;
};

export default function CurriculumSummary({
  variant = "card",
  title = "Curriculum settings",
  description = "Your family learning flow stays anchored to the framework selected in settings.",
  helperText,
  linkLabel = "Open settings",
  linkHref = "/settings#curriculum",
}: CurriculumSummaryProps) {
  const isSubtle = variant === "subtle";

  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: isSubtle ? 16 : 20,
        background: isSubtle ? "#f8fafc" : "#ffffff",
        padding: isSubtle ? 16 : 20,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        Curriculum
      </div>
      <div style={{ fontSize: isSubtle ? 18 : 22, fontWeight: 900, color: "#0f172a" }}>
        {title}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "#334155" }}>{description}</div>
      {helperText ? (
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "#475569" }}>{helperText}</div>
      ) : null}
      <div>
        <Link
          href={linkHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            fontWeight: 800,
            color: "#1d4ed8",
          }}
        >
          {linkLabel}
        </Link>
      </div>
    </section>
  );
}
