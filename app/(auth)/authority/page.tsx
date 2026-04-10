"use client";

import React from "react";
import Link from "next/link";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { familyStyles as S } from "@/lib/theme/familyStyles";

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#ffffff",
    padding: 18,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
  };
}

function buttonStyle(primary = false): React.CSSProperties {
  return {
    border: `1px solid ${primary ? "#2563eb" : "#d1d5db"}`,
    background: primary ? "#2563eb" : "#ffffff",
    color: primary ? "#ffffff" : "#111827",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function pill(bg: string, color: string): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 999,
    padding: "6px 10px",
    background: bg,
    color,
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
}

export default function AuthorityHubPage() {
  return (
    <FamilyTopNavShell
      title="EduDecks Family"
      subtitle="Authority workflow"
      heroTitle="Prepare, build, review, and export with more confidence"
      heroText="This is the formal reporting layer that sits above the everyday family workflow. Move from readiness checks to pack building, export review, and saved authority history without losing the calmer family experience."
      heroAsideTitle="Authority pathway"
      heroAsideText="Readiness helps you see if the pack is forming well. Builder shapes the submission. Export reviews it before download. History keeps an audit trail of what was exported."
    >
      <section style={S.hero()}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.25fr) minmax(320px,0.95fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div>
            <div style={S.label()}>Authority command layer</div>
            <div style={S.display()}>
              Keep the submission flow calm, clear, and durable
            </div>
            <div style={S.body()}>
              The strongest authority workflow is no longer just “export a file.”
              It is now: check readiness, shape the pack, review the structure,
              export carefully, and keep a real export history.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              <Link href="/authority/readiness" style={buttonStyle(false)}>
                Open Readiness
              </Link>
              <Link href="/authority/pack-builder" style={buttonStyle(true)}>
                Open Pack Builder
              </Link>
              <Link href="/authority/export" style={buttonStyle(false)}>
                Open Export
              </Link>
              <Link href="/authority/history" style={buttonStyle(false)}>
                Open History
              </Link>
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={S.label()}>What this layer now includes</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={S.softCard()}>
                <div style={S.h3()}>Readiness</div>
                <div style={S.small()}>
                  Check whether the current evidence base is strong enough for a
                  more formal submission posture.
                </div>
              </div>

              <div style={S.softCard()}>
                <div style={S.h3()}>Pack Builder</div>
                <div style={S.small()}>
                  Choose sections, shape the authority posture, and see confidence
                  guidance before export.
                </div>
              </div>

              <div style={S.softCard()}>
                <div style={S.h3()}>Export Review</div>
                <div style={S.small()}>
                  Review the pack structure, evidence scope, and checklist before
                  downloading DOCX or PDF.
                </div>
              </div>

              <div style={S.softCard()}>
                <div style={S.h3()}>History</div>
                <div style={S.small()}>
                  Keep a real record of export events so the authority workflow
                  feels durable rather than one-off.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 18 }} />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 18,
        }}
      >
        <section style={cardStyle()}>
          <div style={{ ...S.h2(), marginBottom: 12 }}>Recommended flow</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={S.softCard()}>
              <div style={pill("#ecfeff", "#0c4a6e")}>1</div>
              <div style={{ height: 8 }} />
              <div style={S.h3()}>Start with Readiness</div>
              <div style={S.small()}>
                Use the readiness surface to see whether your evidence is broad,
                current, and representative enough.
              </div>
            </div>

            <div style={S.softCard()}>
              <div style={pill("#eff6ff", "#1d4ed8")}>2</div>
              <div style={{ height: 8 }} />
              <div style={S.h3()}>Shape the Pack</div>
              <div style={S.small()}>
                Move into Pack Builder to choose sections, tighten evidence scope,
                and improve confidence before export.
              </div>
            </div>

            <div style={S.softCard()}>
              <div style={pill("#f5f3ff", "#6d28d9")}>3</div>
              <div style={{ height: 8 }} />
              <div style={S.h3()}>Review and Export</div>
              <div style={S.small()}>
                Use Export as the final submission gate for PDF, DOCX, and print.
              </div>
            </div>

            <div style={S.softCard()}>
              <div style={pill("#ecfdf5", "#166534")}>4</div>
              <div style={{ height: 8 }} />
              <div style={S.h3()}>Keep the History</div>
              <div style={S.small()}>
                Review saved export events later in History so the compliance trail
                stays visible.
              </div>
            </div>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ ...S.h2(), marginBottom: 12 }}>Quick actions</div>

          <div style={{ display: "grid", gap: 10 }}>
            <Link href="/authority/readiness" style={buttonStyle(false)}>
              Authority Readiness
            </Link>
            <Link href="/authority/pack-builder" style={buttonStyle(true)}>
              Authority Pack Builder
            </Link>
            <Link href="/authority/export" style={buttonStyle(false)}>
              Authority Pack Export
            </Link>
            <Link href="/authority/history" style={buttonStyle(false)}>
              Authority Export History
            </Link>
            <Link href="/reports/library" style={buttonStyle(false)}>
              Report Library
            </Link>
          </div>
        </section>

        <section style={cardStyle()}>
          <div style={{ ...S.h2(), marginBottom: 12 }}>Best next move</div>
          <div style={S.body()}>
            The strongest move for most families is to open the Pack Builder,
            strengthen any checklist gaps there, then use Export as a calm final
            review surface before downloading.
          </div>

          <div style={{ height: 14 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/authority/pack-builder" style={buttonStyle(true)}>
              Open Pack Builder
            </Link>
            <Link href="/authority/history" style={buttonStyle(false)}>
              View History
            </Link>
          </div>
        </section>
      </section>
    </FamilyTopNavShell>
  );
}
