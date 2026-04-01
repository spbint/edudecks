"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type TrendDir = "up" | "flat" | "down";
type Strength = "light" | "typical" | "strong";
type Confidence = "low" | "medium" | "high";

type Attribute = {
  attribute_id: string;
  key: string;
  name: string;
  domain: string;
  growth_tempo: "slow" | "medium" | "fast_medium";
  sort_order: number;
  state_value: number;
  trend: TrendDir;
};

type Evidence = {
  id: string;
  created_at: string;
  occurred_on: string | null;
  learning_area: string | null;
  title: string | null;
  summary: string | null;
};

type TrendPoint = {
  period_start: string;
  value: number;
};

type ProfileData = {
  student: {
    student_id: string;
    last_activity_at: string | null;
  };
  attributes: Attribute[];
  recent_evidence: Evidence[];
  selected_attribute: {
    key: string | null;
    trend_points: TrendPoint[];
  };
};

type DrawerPayload = {
  evidence: {
    id: string;
    student_id: string;
    created_at: string;
    occurred_on: string | null;
    learning_area: string | null;
    title: string | null;
    summary: string | null;
    body: string | null;
    attachment_urls: string[] | null;
    visibility: string;
  };
  attributes: Array<{
    attribute_id: string;
    key: string;
    name: string;
    domain: string;
    growth_tempo: "slow" | "medium" | "fast_medium";
    strength: Strength;
    confidence: Confidence;
    notes: string | null;
  }>;
};

type CurriculumItem = {
  code: string;
  year_level: number;
  learning_area: string;
  description: string | null;
  weight: number | null;
};

function trendGlyph(t: TrendDir) {
  return t === "up" ? "▲" : t === "down" ? "▼" : "—";
}

function tempoLabel(t: Attribute["growth_tempo"]) {
  if (t === "slow") return "Slow build";
  if (t === "fast_medium") return "Fast–medium";
  return "Medium";
}

function fmtDate(v: string | null) {
  return v ? v.slice(0, 10) : "—";
}

function TrendLineChart({ points }: { points: TrendPoint[] }) {
  if (!points.length) return <div style={{ fontSize: 13, color: "#666" }}>No trend data yet.</div>;

  const w = 300;
  const h = 130;
  const pad = 12;

  const sorted = [...points].sort((a, b) => a.period_start.localeCompare(b.period_start));
  const values = sorted.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const step = (w - pad * 2) / Math.max(sorted.length - 1, 1);

  const pts = sorted.map((p, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (p.value - min) / range);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <polyline points={pts.join(" ")} fill="none" stroke="#4b6bff" strokeWidth="2.5" />
      {pts.map((p, i) => {
        const [x, y] = p.split(",");
        return <circle key={i} cx={x} cy={y} r="3" fill="#4b6bff" />;
      })}
    </svg>
  );
}

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAttributeKey, setSelectedAttributeKey] = useState<string | null>(null);

  // Evidence filters
  const [search, setSearch] = useState("");
  const [learningAreaFilter, setLearningAreaFilter] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerEvidenceId, setDrawerEvidenceId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<DrawerPayload | null>(null);

  // Curriculum Lens
  const [curriculumLens, setCurriculumLens] = useState<"none" | "ACARA">("none");
  const [curriculumItems, setCurriculumItems] = useState<CurriculumItem[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  // Load profile
  useEffect(() => {
    if (!studentId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc("get_student_profile_view", {
        p_student_id: studentId,
        p_recent_evidence_limit: 50,
        p_selected_attribute_key: selectedAttributeKey,
        p_trend_points_limit: 18,
      });

      if (error) {
        setError(error.message);
        setData(null);
      } else {
        setData(data);
      }

      setLoading(false);
    };

    load();
  }, [studentId, selectedAttributeKey]);

  // Load curriculum lens (contextual)
  useEffect(() => {
    if (!studentId) return;

    if (curriculumLens === "none") {
      setCurriculumItems([]);
      return;
    }

    const loadLens = async () => {
      setCurriculumLoading(true);

      const { data, error } = await supabase.rpc("get_curriculum_lens_view", {
        p_student_id: studentId,
        p_framework_key: curriculumLens,
        p_attribute_key: selectedAttributeKey, // <-- FM-style: contextual to selection
        p_year_level: null,
        p_learning_area: null,
        p_max_rows: 80,
      });

      if (error) {
        console.error(error);
        setCurriculumItems([]);
      } else {
        setCurriculumItems((data ?? []) as CurriculumItem[]);
      }

      setCurriculumLoading(false);
    };

    loadLens();
  }, [curriculumLens, studentId, selectedAttributeKey]);

  const groupedAttributes = useMemo(() => {
    if (!data) return {};
    const g = data.attributes.reduce<Record<string, Attribute[]>>((acc, a) => {
      acc[a.domain] = acc[a.domain] || [];
      acc[a.domain].push(a);
      return acc;
    }, {});
    // keep stable ordering within groups
    Object.keys(g).forEach((k) => g[k].sort((a, b) => a.sort_order - b.sort_order));
    return g;
  }, [data]);

  const learningAreas = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.recent_evidence.map((e) => e.learning_area).filter(Boolean))) as string[];
  }, [data]);

  const filteredEvidence = useMemo(() => {
    if (!data) return [];
    return data.recent_evidence.filter((e) => {
      if (learningAreaFilter && e.learning_area !== learningAreaFilter) return false;
      if (search) {
        const t = `${e.title ?? ""} ${e.summary ?? ""}`.toLowerCase();
        if (!t.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [data, search, learningAreaFilter]);

  const selectedAttr = useMemo(() => {
    if (!data || !selectedAttributeKey) return null;
    return data.attributes.find((a) => a.key === selectedAttributeKey) ?? null;
  }, [data, selectedAttributeKey]);

  const openDrawerForEvidence = async (evidenceId: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError(null);
    setDrawerEvidenceId(evidenceId);
    setDrawerData(null);

    const { data, error } = await supabase.rpc("get_evidence_drawer_view", {
      p_evidence_id: evidenceId,
    });

    if (error) {
      console.error(error);
      setDrawerError(error.message);
      setDrawerData(null);
    } else {
      setDrawerData(data);
    }

    setDrawerLoading(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerLoading(false);
    setDrawerError(null);
    setDrawerEvidenceId(null);
    setDrawerData(null);
  };

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!data) return <div style={{ padding: 24 }}>No data</div>;

  return (
    <>
      {/* Lens Toggle (global) */}
      <div style={{ padding: "0 24px 12px", display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 800 }}>Curriculum lens:</div>
        <select value={curriculumLens} onChange={(e) => setCurriculumLens(e.target.value as "none" | "ACARA")}>
          <option value="none">Off (Attributes only)</option>
          <option value="ACARA">ACARA (Australia)</option>
        </select>
        {curriculumLens !== "none" && (
          <div style={{ fontSize: 12, color: "#666" }}>
            Tip: select an attribute to see mapped ACARA standards.
          </div>
        )}
      </div>

      {/* Main grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "340px 1fr 340px",
          gap: 24,
          padding: 24,
          alignItems: "start",
        }}
      >
        {/* LEFT — Attributes (grouped, sticky) */}
        <div style={{ position: "sticky", top: 16 }}>
          <h2 style={{ marginTop: 0 }}>Learning Attributes</h2>

          {Object.entries(groupedAttributes).map(([domain, attrs]) => (
            <div key={domain} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#555",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {domain}
              </div>

              {attrs.map((a) => {
                const selected = a.key === selectedAttributeKey;
                return (
                  <div
                    key={a.attribute_id}
                    onClick={() => setSelectedAttributeKey(a.key)}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: "1px solid #eee",
                      marginBottom: 8,
                      cursor: "pointer",
                      background: selected ? "#f5f7ff" : "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
                      <span>{a.name}</span>
                      <span>{trendGlyph(a.trend)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#666" }}>{tempoLabel(a.growth_tempo)}</div>

                    <div style={{ height: 6, background: "#eee", borderRadius: 999, marginTop: 8 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(0, Math.min(100, (a.state_value / 20) * 100))}%`,
                          background: selected ? "#4b6bff" : "#999",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* MIDDLE — Evidence (search + filter) */}
        <div>
          <h2 style={{ marginTop: 0 }}>Evidence</h2>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              placeholder="Search evidence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: 8 }}
            />
            <select
              value={learningAreaFilter ?? ""}
              onChange={(e) => setLearningAreaFilter(e.target.value || null)}
              style={{ padding: 8 }}
            >
              <option value="">All areas</option>
              {learningAreas.map((la) => (
                <option key={la} value={la}>
                  {la}
                </option>
              ))}
            </select>
          </div>

          {filteredEvidence.length === 0 ? (
            <div style={{ color: "#666" }}>No evidence matches your filters.</div>
          ) : (
            filteredEvidence.map((e) => (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => openDrawerForEvidence(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") openDrawerForEvidence(e.id);
                }}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "12px 0",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: 800 }}>{e.title ?? "Untitled evidence"}</div>
                {e.summary && <div style={{ marginTop: 4 }}>{e.summary}</div>}
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  {e.learning_area ?? "—"} · {fmtDate(e.occurred_on)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT — Detail + Chart + Curriculum overlay (sticky) */}
        <div style={{ position: "sticky", top: 16 }}>
          <h2 style={{ marginTop: 0 }}>Detail</h2>

          {!selectedAttr ? (
            <div style={{ color: "#666" }}>Select an attribute to view development and curriculum alignment.</div>
          ) : (
            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 14, background: "#fff" }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{selectedAttr.name}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                {selectedAttr.domain} · {tempoLabel(selectedAttr.growth_tempo)}
              </div>

              <div style={{ marginTop: 14, fontWeight: 800 }}>Development over time</div>
              <div style={{ marginTop: 10 }}>
                <TrendLineChart points={data.selected_attribute?.trend_points ?? []} />
              </div>

              {/* Curriculum Overlay (contextual) */}
              {curriculumLens !== "none" && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 900, fontSize: 12, textTransform: "uppercase", color: "#555" }}>
                    Curriculum alignment (ACARA)
                  </div>

                  {curriculumLoading ? (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>Loading alignment…</div>
                  ) : !selectedAttributeKey ? (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                      Select an attribute to see mapped ACARA achievement standards.
                    </div>
                  ) : curriculumItems.length === 0 ? (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                      No ACARA standards mapped to this attribute yet.
                    </div>
                  ) : (
                    <div style={{ marginTop: 10 }}>
                      {curriculumItems.map((c) => (
                        <div
                          key={c.code}
                          style={{
                            border: "1px solid #eee",
                            borderRadius: 10,
                            padding: 10,
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ fontWeight: 900, fontSize: 13 }}>
                            {c.code} · Year {c.year_level} · {c.learning_area}
                            {typeof c.weight === "number" ? (
                              <span style={{ fontWeight: 700, color: "#666" }}> · w {c.weight}</span>
                            ) : null}
                          </div>
                          {c.description ? (
                            <div style={{ marginTop: 6, fontSize: 13, color: "#444" }}>{c.description}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Evidence Drawer */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: 520,
              background: "#fff",
              borderLeft: "1px solid #eee",
              padding: 18,
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Evidence Details</div>
              <button
                onClick={closeDrawer}
                style={{
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              {drawerLoading && <div style={{ color: "#666" }}>Loading evidence…</div>}
              {drawerError && <div style={{ color: "red" }}>Error: {drawerError}</div>}

              {!drawerLoading && !drawerError && drawerData?.evidence && (
                <>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    {drawerData.evidence.title ?? "Untitled evidence"}
                  </div>

                  <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                    {drawerData.evidence.learning_area ?? "—"} ·{" "}
                    {fmtDate(drawerData.evidence.occurred_on) ?? fmtDate(drawerData.evidence.created_at)}
                    {drawerData.evidence.visibility ? <> · {drawerData.evidence.visibility}</> : null}
                  </div>

                  {drawerData.evidence.summary && (
                    <div style={{ marginTop: 12, fontSize: 14 }}>{drawerData.evidence.summary}</div>
                  )}

                  {drawerData.evidence.body && (
                    <div style={{ marginTop: 12, fontSize: 14, whiteSpace: "pre-wrap" }}>
                      {drawerData.evidence.body}
                    </div>
                  )}

                  <div style={{ marginTop: 18, fontWeight: 900 }}>Feeds these Learning Attributes</div>

                  {drawerData.attributes?.length ? (
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 10 }}>
                      {drawerData.attributes.map((a) => (
                        <li
                          key={a.attribute_id}
                          style={{
                            border: "1px solid #eee",
                            borderRadius: 12,
                            padding: 12,
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ fontWeight: 800 }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                            {a.domain} · {tempoLabel(a.growth_tempo)}
                          </div>

                          <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 12 }}>
                            <div>
                              <span style={{ color: "#666" }}>Strength:</span>{" "}
                              <span style={{ fontWeight: 800 }}>{a.strength}</span>
                            </div>
                            <div>
                              <span style={{ color: "#666" }}>Confidence:</span>{" "}
                              <span style={{ fontWeight: 800 }}>{a.confidence}</span>
                            </div>
                          </div>

                          {a.notes && (
                            <div style={{ marginTop: 10, fontSize: 13 }}>
                              <span style={{ color: "#666" }}>Notes:</span> {a.notes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ marginTop: 10, color: "#666" }}>No attributes tagged to this evidence yet.</div>
                  )}

                  <div style={{ marginTop: 12, fontSize: 12, color: "#999" }}>
                    Evidence ID: {drawerEvidenceId}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
