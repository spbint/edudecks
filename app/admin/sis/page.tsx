"use client";

import React from "react";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import { useRouter } from "next/navigation";

export default function SisHomePage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7fb" }}>
      <AdminLeftNav />
      <main style={{ flex: 1, padding: 22, maxWidth: 1200, margin: "0 auto" }}>
        <section style={{ border: "1px solid #e8eaf0", borderRadius: 22, background: "#fff", padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#6b7280", letterSpacing: 0.6 }}>SIS</div>
          <div style={{ fontSize: 40, fontWeight: 950, color: "#0f172a", marginTop: 6 }}>SIS integrations</div>
          <div style={{ marginTop: 10, color: "#334155", fontWeight: 800 }}>
            This is scaffolding for future roster sync: OneRoster / Compass / Sentral / EdPass.
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/admin/sis/connectors")}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #0f172a", background: "#0f172a", color: "#fff", fontWeight: 900, cursor: "pointer" }}
            >
              Manage connectors →
            </button>
            <button
              onClick={() => router.push("/admin/student-entry")}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#0f172a", fontWeight: 900, cursor: "pointer" }}
            >
              Back to Students
            </button>
          </div>
        </section>

        <section style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          {[
            { title: "OneRoster", desc: "Industry standard roster sync (CSV + API). Target: nightly sync.", status: "Planned" },
            { title: "Compass", desc: "Connector slot for Compass exports/API. Target: roster + classes.", status: "Planned" },
            { title: "Sentral", desc: "Connector slot for Sentral. Target: roster + attendance later.", status: "Planned" },
            { title: "EdPass", desc: "Auth + roster pipeline placeholder.", status: "Planned" },
          ].map((x) => (
            <div key={x.title} style={{ border: "1px solid #e8eaf0", borderRadius: 18, background: "#fff", padding: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 950, color: "#0f172a" }}>{x.title}</div>
              <div style={{ marginTop: 6, color: "#475569", fontWeight: 800, fontSize: 13 }}>{x.desc}</div>
              <div style={{ marginTop: 10, display: "inline-flex", padding: "6px 10px", borderRadius: 999, border: "1px solid #e5e7eb", fontWeight: 900, fontSize: 12 }}>
                {x.status}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}