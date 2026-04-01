"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ActiveChildContextBar from "@/app/components/ActiveChildContextBar";
import { useActiveStudent } from "@/app/hooks/useActiveStudent";

type TemplateKey =
  | "general_portfolio"
  | "homeschool_registration"
  | "term_summary"
  | "evidence_appendix"
  | "christian_overlay"
  | "custom_parent_view";

type TemplateCard = {
  key: TemplateKey;
  title: string;
  subtitle: string;
  description: string;
  bestFor: string;
  includes: string[];
};

function safe(v: any) {
  return String(v ?? "").trim();
}

const templates: TemplateCard[] = [
  {
    key: "general_portfolio",
    title: "General Portfolio",
    subtitle: "Broad, flexible portfolio export",
    description:
      "A clean all-purpose portfolio view that works well for general homeschooling records, family review, and informal sharing.",
    bestFor: "Parents wanting a simple evidence-based summary.",
    includes: ["Coverage summary", "Grouped evidence", "Chronological record", "Flexible structure"],
  },
  {
    key: "homeschool_registration",
    title: "Homeschool Registration",
    subtitle: "Closer to authority-facing reporting",
    description:
      "Designed for situations where a family needs a more formal presentation of learning evidence and curriculum coverage for registration or review.",
    bestFor: "Registration, review meetings, or authority submissions.",
    includes: ["Coverage buckets", "Reporting tone", "Representative evidence", "Stronger structure"],
  },
  {
    key: "term_summary",
    title: "Term Summary",
    subtitle: "Shorter reporting window",
    description:
      "A concise template focused on one defined learning period, useful for regular family check-ins and easier term-by-term reporting.",
    bestFor: "Quarterly or term-based reflection and review.",
    includes: ["Date-range focus", "Term snapshot", "Summary-friendly layout", "Review-ready format"],
  },
  {
    key: "evidence_appendix",
    title: "Evidence Appendix",
    subtitle: "Rawer supporting evidence format",
    description:
      "A supporting export built around evidence entries themselves rather than polished narrative, useful as backup documentation.",
    bestFor: "Supporting documents, appendices, and evidence packs.",
    includes: ["Entry list", "Dates", "Learning areas", "Audit-friendly evidence trail"],
  },
  {
    key: "christian_overlay",
    title: "Christian / Biblical Overlay",
    subtitle: "Faith-aware presentation",
    description:
      "A version intended for families or schools who want learning evidence framed with room for biblical themes, values, or Christian studies.",
    bestFor: "Christian homeschool or Christian school-aligned families.",
    includes: ["Faith learning space", "Biblical studies visibility", "Values-aware framing", "Portfolio structure"],
  },
  {
    key: "custom_parent_view",
    title: "Custom Parent View",
    subtitle: "Parent-first flexible structure",
    description:
      "A softer, family-facing template that is less authority-shaped and more useful for everyday review, confidence, and planning.",
    bestFor: "Parents wanting clarity before formal export.",
    includes: ["Low-pressure layout", "Readable summary", "Parent-friendly presentation", "Flexible review"],
  },
];

const S = {
  shell: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: 24,
  } as React.CSSProperties,

  wrap: {
    maxWidth: 1220,
    margin: "0 auto",
  } as React.CSSProperties,

  hero: {
    border: "1px solid #e5e7eb",
    borderRadius: 26,
    padding: 28,
    background:
      "linear-gradient(135deg, rgba(17,24,39,0.06), rgba(99,102,241,0.08))",
  } as React.CSSProperties,

  subtle: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  } as React.CSSProperties,

  h1: {
    margin: "10px 0 0 0",
    fontSize: 38,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.05,
  } as React.CSSProperties,

  lead: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 1.65,
    color: "#475569",
    fontWeight: 700,
    maxWidth: 860,
  } as React.CSSProperties,

  callout: {
    marginTop: 16,
    background: "#eff6ff",
    border: "1px solid #dbeafe",
    color: "#1d4ed8",
    padding: 14,
    borderRadius: 16,
    fontWeight: 800,
    lineHeight: 1.55,
  } as React.CSSProperties,

  btnRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 22,
  } as React.CSSProperties,

  btn: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 14,
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  grid2: {
    display: "grid",
    gridTemplateColumns: "1.4fr 0.9fr",
    gap: 14,
    marginTop: 18,
  } as React.CSSProperties,

  grid3: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
    marginTop: 18,
  } as React.CSSProperties,

  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  sectionText: {
    marginTop: 8,
    fontWeight: 700,
    color: "#475569",
    lineHeight: 1.6,
    fontSize: 14,
  } as React.CSSProperties,

  templateGrid: {
    display: "grid",
    gap: 12,
    marginTop: 14,
  } as React.CSSProperties,

  templateCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    textAlign: "left",
    cursor: "pointer",
  } as React.CSSProperties,

  templateCardActive: {
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    borderRadius: 18,
    padding: 16,
    textAlign: "left",
    cursor: "pointer",
  } as React.CSSProperties,

  templateTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  templateSub: {
    marginTop: 4,
    color: "#6366f1",
    fontWeight: 900,
    fontSize: 13,
  } as React.CSSProperties,

  templateText: {
    marginTop: 8,
    color: "#475569",
    fontWeight: 700,
    lineHeight: 1.5,
    fontSize: 14,
  } as React.CSSProperties,

  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #dbe1ea",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,

  chipAccent: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 10px",
    borderRadius: 999,
    background: "#eef2ff",
    border: "1px solid #c7d2fe",
    color: "#4338ca",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,

  preview: {
    marginTop: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    background: "#fff",
  } as React.CSSProperties,

  previewTitle: {
    fontSize: 17,
    fontWeight: 950,
    color: "#0f172a",
  } as React.CSSProperties,

  previewText: {
    marginTop: 10,
    color: "#334155",
    fontWeight: 700,
    lineHeight: 1.6,
    fontSize: 14,
  } as React.CSSProperties,

  info: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    padding: 10,
    color: "#1d4ed8",
    fontWeight: 900,
  } as React.CSSProperties,

  warn: {
    marginTop: 12,
    borderRadius: 12,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 10,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,
};

export default function ExportTemplatesPage() {
  const router = useRouter();
  const { studentName, activeStudentId } = useActiveStudent();

  const [selected, setSelected] = useState<TemplateKey>("homeschool_registration");

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.key === selected) || templates[0];
  }, [selected]);

  function requireChild(next: () => void) {
    if (!activeStudentId) {
      router.push("/children");
      return;
    }
    next();
  }

  return (
    <div style={S.shell}>
      <div style={S.wrap}>
        <ActiveChildContextBar
          showOpenProfile={true}
          showOpenPortfolio={true}
          showAddEvidence={true}
        />

        <section style={S.hero}>
          <div style={S.subtle}>Authority Templates</div>
          <h1 style={S.h1}>Choose a reporting template</h1>
          <div style={S.lead}>
            This page helps parents choose the best presentation style before launching
            into exports, portfolio review, or sharing. It is the bridge between
            child context and authority-facing reporting structure.
          </div>

          <div style={S.callout}>
            The goal is not just exporting data — it is selecting the right reporting
            shape for the audience and purpose.
          </div>

          <div style={S.btnRow}>
            <button
              style={S.btnPrimary}
              onClick={() => router.push("/exports")}
            >
              Back to exports launcher
            </button>

            <button
              style={S.btn}
              onClick={() =>
                requireChild(() =>
                  router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/portfolio`)
                )
              }
            >
              Open source portfolio
            </button>

            <button
              style={S.btn}
              onClick={() =>
                requireChild(() =>
                  router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/share`)
                )
              }
            >
              Open sharing tools
            </button>
          </div>

          {!activeStudentId ? (
            <div style={S.warn}>
              No active child selected yet. Choose a child first so a reporting template can be applied in context.
            </div>
          ) : null}
        </section>

        <section style={S.grid2}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Available templates</div>
            <div style={S.sectionText}>
              Choose the reporting style that best matches the parent’s purpose or authority requirement.
            </div>

            <div style={S.templateGrid}>
              {templates.map((template) => {
                const active = template.key === selected;
                return (
                  <button
                    key={template.key}
                    style={active ? S.templateCardActive : S.templateCard}
                    onClick={() => setSelected(template.key)}
                  >
                    <div style={S.templateTitle}>{template.title}</div>
                    <div style={S.templateSub}>{template.subtitle}</div>
                    <div style={S.templateText}>{template.description}</div>

                    <div style={S.chipRow}>
                      {active ? <span style={S.chipAccent}>Selected</span> : null}
                      <span style={S.chip}>Best for: {template.bestFor}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Selected template</div>
            <div style={S.sectionText}>
              A preview of the reporting direction you are preparing.
            </div>

            <div style={S.preview}>
              <div style={S.previewTitle}>{selectedTemplate.title}</div>
              <div style={S.previewText}>
                Child: <strong>{studentName || "No child selected"}</strong>
              </div>
              <div style={S.previewText}>
                Focus: <strong>{selectedTemplate.subtitle}</strong>
              </div>
              <div style={S.previewText}>{selectedTemplate.description}</div>

              <div style={S.chipRow}>
                {selectedTemplate.includes.map((item) => (
                  <span key={item} style={S.chip}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div style={S.info}>
              Later, this selected template can drive report layout, headings,
              grouped sections, and export bundle structure automatically.
            </div>

            <div style={S.btnRow}>
              <button
                style={S.btnPrimary}
                onClick={() => router.push("/exports")}
              >
                Use this template in exports
              </button>

              <button
                style={S.btn}
                onClick={() =>
                  requireChild(() =>
                    router.push(`/admin/students/${encodeURIComponent(activeStudentId!)}/portfolio`)
                  )
                }
              >
                Review portfolio first
              </button>
            </div>
          </div>
        </section>

        <section style={S.grid3}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Why template selection matters</div>
            <div style={S.sectionText}>
              Different audiences expect different kinds of reporting. A flexible export
              system becomes more useful when parents can intentionally choose the format first.
            </div>

            <div style={S.chipRow}>
              <span style={S.chip}>Registration</span>
              <span style={S.chip}>Review meetings</span>
              <span style={S.chip}>Evidence packs</span>
              <span style={S.chip}>Parent confidence</span>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Likely next upgrade</div>
            <div style={S.sectionText}>
              The natural next step is to make template choice actually influence
              export layout and content selection across the reporting workflow.
            </div>

            <div style={S.chipRow}>
              <span style={S.chip}>Template-aware exports</span>
              <span style={S.chip}>PDF generator</span>
              <span style={S.chip}>Section presets</span>
              <span style={S.chip}>Authority bundles</span>
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Best immediate workflow</div>
            <div style={S.sectionText}>
              Choose the template here, confirm the child and timeframe in the exports page,
              then open the source portfolio or share page to continue.
            </div>

            <div style={S.btnRow}>
              <button style={S.btn} onClick={() => router.push("/exports")}>
                Exports launcher
              </button>
              <button style={S.btn} onClick={() => router.push("/portfolio")}>
                Portfolio launcher
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}