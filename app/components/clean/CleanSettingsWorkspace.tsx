"use client";

import React from "react";
import CleanFamilyWorkspaceProvider, {
  useCleanFamilyWorkspace,
} from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import CleanAccountMenu from "@/app/components/clean/CleanAccountMenu";
import { CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE } from "@/lib/clean/family/client";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "32px 20px 48px",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  display: "grid",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  background: "#ffffff",
  padding: 20,
  boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
};

function CleanSettingsWorkspaceBody() {
  const workspace = useCleanFamilyWorkspace();

  return (
    <div style={shellStyle}>
      <div style={wrapStyle}>
        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8, flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase" }}>
                Family settings
              </div>
              <h1 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>My Settings</h1>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                This is the future home for country and state reporting context, curriculum setup, and family preferences.
              </p>
            </div>
            <CleanAccountMenu />
          </div>
        </section>

        {workspace.loading ? <section style={cardStyle}>Loading setup preview...</section> : null}

        {!workspace.loading && workspace.schemaMissing ? (
          <section style={cardStyle}>
            <strong style={{ display: "block", marginBottom: 8 }}>{CLEAN_SCHEMA_NOT_INSTALLED_MESSAGE}</strong>
            <p style={{ margin: 0, color: "#475569" }}>
              This setup preview does not fall back to older settings tables.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.requiresFamilyCreation ? (
          <section style={cardStyle}>
            <p style={{ margin: 0, color: "#475569" }}>
              Create a family profile first. Settings are family-based here too.
            </p>
          </section>
        ) : null}

        {!workspace.loading && !workspace.schemaMissing && workspace.profile ? (
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0, color: "#0f172a" }}>Current setup preview</h2>
            <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>
              This helps MyLearna shape portfolios and reports for your location once full editing is ready.
            </p>
            <div style={{ display: "grid", gap: 10, color: "#334155" }}>
              <div>
                <strong>Family name:</strong> {workspace.profile.displayName}
              </div>
              <div>
                <strong>Country:</strong> {workspace.profile.countryCode || "Not set"}
              </div>
              <div>
                <strong>Jurisdiction:</strong> {workspace.profile.jurisdictionCode || "Not set"}
              </div>
              <div>
                <strong>Curriculum framework:</strong> {workspace.profile.curriculumFrameworkId || "Not set"}
              </div>
              <div>
                <strong>Reporting mode:</strong> {workspace.profile.reportingMode}
              </div>
              <div>
                <strong>Week start:</strong> {workspace.profile.weekStart}
              </div>
              <div>
                <strong>Privacy default:</strong> {workspace.profile.privacyDefault}
              </div>
              <div>
                <strong>Export style:</strong> {workspace.profile.exportStyle}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function CleanSettingsWorkspace() {
  return (
    <CleanFamilyWorkspaceProvider>
      <CleanSettingsWorkspaceBody />
    </CleanFamilyWorkspaceProvider>
  );
}
