"use client";

import React from "react";
import type { BrentEvidencePackModel } from "@/lib/clean/outputs/brentEvidencePackPdf";

const previewWrapStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  overflow: "hidden",
};

const previewHeaderStyle: React.CSSProperties = {
  padding: 20,
  borderBottom: "1px solid #e2e8f0",
  display: "grid",
  gap: 10,
  background: "#f8fbff",
};

const previewBodyStyle: React.CSSProperties = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  display: "grid",
  gap: 10,
  background: "#ffffff",
};

function renderFieldRows(items: BrentEvidencePackModel["learnerDetails"]) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 12,
            display: "grid",
            gap: 4,
            background: "#f8fafc",
          }}
        >
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
            {item.label}
          </div>
          <div style={{ color: "#0f172a", lineHeight: 1.6 }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function CleanBrentEvidencePackPreview({
  model,
}: {
  model: BrentEvidencePackModel;
}) {
  return (
    <article style={previewWrapStyle}>
      <header style={previewHeaderStyle}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.08em",
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          Brent pack preview
        </div>
        <h2 style={{ margin: 0, color: "#0f172a", fontSize: 28 }}>{model.title}</h2>
        <div style={{ color: "#475569", lineHeight: 1.7 }}>
          {model.preparedNote}
        </div>
        <div
          style={{
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 12,
              padding: 12,
              background: "#ffffff",
              display: "grid",
              gap: 4,
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
              Learner
            </div>
            <strong style={{ color: "#0f172a" }}>{model.learnerName}</strong>
            <div style={{ color: "#475569" }}>{model.familyName}</div>
          </div>

          <div
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 12,
              padding: 12,
              background: "#ffffff",
              display: "grid",
              gap: 4,
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
              Brent context
            </div>
            <strong style={{ color: "#0f172a" }}>{model.localAuthorityLabel}</strong>
            <div style={{ color: "#475569" }}>
              {model.nationLabel} - {model.countryLabel}
            </div>
          </div>

          <div
            style={{
              border: "1px solid #dbeafe",
              borderRadius: 12,
              padding: 12,
              background: "#ffffff",
              display: "grid",
              gap: 4,
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
              Evidence summary
            </div>
            <strong style={{ color: "#0f172a" }}>
              {model.evidenceCount} evidence item{model.evidenceCount === 1 ? "" : "s"}
            </strong>
            <div style={{ color: "#475569" }}>
              {model.highlightedEvidenceCount} portfolio highlight
              {model.highlightedEvidenceCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        <div style={{ color: "#64748b", lineHeight: 1.7 }}>{model.disclaimer}</div>
      </header>

      <div style={previewBodyStyle}>
        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Learner / pupil details</h3>
          {renderFieldRows(model.learnerDetails)}
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Parent / carer details</h3>
          {renderFieldRows(model.parentCarerDetails)}
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Learning and attendance overview</h3>
          {renderFieldRows(model.learningOverview)}
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Progress against outcomes</h3>
          {model.progressAgainstOutcomes.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {model.progressAgainstOutcomes.map((item) => (
                <div
                  key={item.focusArea}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 6,
                    background: "#f8fafc",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>{item.focusArea}</strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    <strong>Progress observed:</strong> {item.progressObserved}
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    <strong>Evidence used:</strong> {item.evidenceUsed}
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    <strong>Next support needed:</strong> {item.nextSupportNeeded}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              No formal outcomes have been added yet. Use My Capture, My Portfolio, and My Reports to build supporting evidence.
            </p>
          )}
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Evidence of attainment over time</h3>
          {model.evidenceOfAttainment.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {model.evidenceOfAttainment.map((group) => (
                <div key={group.title} style={{ display: "grid", gap: 8 }}>
                  <strong style={{ color: "#0f172a" }}>{group.title}</strong>
                  {group.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: 12,
                        display: "grid",
                        gap: 4,
                        background: "#f8fafc",
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>
                        {item.observedOnLabel} - {item.title}
                      </strong>
                      <div style={{ color: "#475569", lineHeight: 1.6 }}>
                        {item.summary}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              No learning evidence has been captured yet.
            </p>
          )}
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Academic progress</h3>
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            {model.academicProgress.map((item) => (
              <div
                key={item.title}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gap: 6,
                  background: "#f8fafc",
                }}
              >
                <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>{item.summary}</div>
                <div style={{ color: "#64748b", lineHeight: 1.6 }}>
                  {item.evidenceExamples}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>SEND areas of need</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {model.sendAreas.map((item) => (
              <div
                key={item.title}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                  display: "grid",
                  gap: 6,
                  background: "#f8fafc",
                }}
              >
                <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  <strong>Strengths / progress:</strong> {item.strengthsProgress}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  <strong>Current needs / support:</strong> {item.currentNeedsSupport}
                </div>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>
                  <strong>Evidence / examples:</strong> {item.evidenceExamples}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Young person views</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {model.youngPersonViews.map((item) => (
              <div key={item.prompt} style={{ display: "grid", gap: 4 }}>
                <strong style={{ color: "#0f172a" }}>{item.prompt}</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>{item.response}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Parent / carer views</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {model.parentCarerViews.map((item) => (
              <div key={item.prompt} style={{ display: "grid", gap: 4 }}>
                <strong style={{ color: "#0f172a" }}>{item.prompt}</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>{item.response}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Next steps and support planning</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {model.nextSteps.map((item) => (
              <div key={item.label} style={{ display: "grid", gap: 4 }}>
                <strong style={{ color: "#0f172a" }}>{item.label}</strong>
                <div style={{ color: "#475569", lineHeight: 1.6 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={{ margin: 0, color: "#0f172a" }}>Evidence appendix</h3>
          {model.evidenceAppendix.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {model.evidenceAppendix.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 4,
                    background: "#f8fafc",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>
                    {item.observedOnLabel} - {item.title}
                  </strong>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>
                    {item.learningArea}
                    {item.isHighlighted ? " - Portfolio highlight" : ""}
                  </div>
                  <div style={{ color: "#475569", lineHeight: 1.6 }}>{item.summary}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
              No learning evidence has been captured yet.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
