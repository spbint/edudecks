"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLeftNav from "@/app/components/AdminLeftNav";
import AdminShell from "../components/AdminShell";
import { supabase } from "@/lib/supabaseClient";

/** ─────────────────────────────────────────────────────────────
 *  CONFIG
 *  ───────────────────────────────────────────────────────────── */
const EVIDENCE_INSTRUMENT_FK = "instrument_id" as const;

type TabKey = "overview" | "evidence" | "audit";

type InstrumentRow = {
  id: string;
  label?: string | null;
  name?: string | null;
  short?: string | null;
  code?: string | null;
  domain?: string | null;
  year_level?: number | null;
  is_active?: boolean | null;
  archived?: boolean | null;
  created_at?: string | null;
};

type EvidenceRow = {
  id: string;
  created_at?: string | null;
  student_id?: string | null;
  class_id?: string | null;
  instrument_id?: string | null;
  instrument_fk?: string | null;
  notes?: string | null;
  score?: number | null;
  percentile?: number | null;
  stanine?: number | null;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safeStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function getInstrumentTitle(i: InstrumentRow) {
  return i.label ?? i.name ?? i.short ?? i.code ?? i.id;
}

function getInstrumentStatus(i: InstrumentRow) {
  const active =
    typeof i.is_active === "boolean"
      ? i.is_active
      : typeof i.archived === "boolean"
      ? !i.archived
      : null;
  if (active === null) return "Unknown";
  return active ? "Active" : "Archived";
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-900">
      {text}
    </span>
  );
}

function MutedPill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-700">
      {text}
    </span>
  );
}

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "dash-btn-muted",
        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black",
        active && "border-blue-300 bg-blue-50"
      )}
    >
      {label}
    </button>
  );
}

/** Best-effort table probing so we don’t brick when schema differs */
async function trySelect<T>(
  table: string,
  select: string,
  opts?: { limit?: number; order?: { col: string; ascending?: boolean } }
): Promise<{ data: T[] | null; error: any }> {
  let q = supabase.from(table).select(select);
  if (opts?.order) q = q.order(opts.order.col, { ascending: opts.order.ascending ?? false });
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  return { data: (data as any) ?? null, error };
}

async function firstTableThatWorks<T>(
  tables: string[],
  select: string,
  opts?: { limit?: number; order?: { col: string; ascending?: boolean } }
): Promise<{ table: string | null; data: T[]; error: any | null }> {
  for (const t of tables) {
    const res = await trySelect<T>(t, select, opts);
    if (!res.error && Array.isArray(res.data)) return { table: t, data: res.data, error: null };
  }
  const last = await trySelect<T>(tables[tables.length - 1], select, opts);
  return { table: null, data: [], error: last.error ?? "No matching table found." };
}

async function countByInstrument(
  evidenceTable: string,
  instrumentId: string
): Promise<{ total: number; lastAt: string | null }> {
  const { data, error } = await supabase
    .from(evidenceTable)
    .select("id, created_at, instrument_id, instrument_fk, instrument", { count: "exact" })
    .or(
      [
        `${EVIDENCE_INSTRUMENT_FK}.eq.${instrumentId}`,
        `instrument_id.eq.${instrumentId}`,
        `instrument_fk.eq.${instrumentId}`,
      ].join(",")
    )
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return { total: 0, lastAt: null };

  const lastAt = (data?.[0] as any)?.created_at ?? null;
  return { total: Array.isArray(data) ? data.length : 0, lastAt };
}

function AssessmentsPageFallback() {
  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Assessments"
          subtitle="FM-style instruments dashboard • evidence • coverage • audit"
          backHref="/admin"
        >
          <div className="dash-alert">Loading assessments…</div>
        </AdminShell>
      </div>
    </div>
  );
}

function AssessmentsPageInner() {
  const router = useRouter();
  const sp = useSearchParams();

  const tab = (sp.get("tab") as TabKey) || "overview";
  const selectedId = sp.get("instrument") || "";

  const [loading, setLoading] = useState(true);
  const [loadHint, setLoadHint] = useState<string | null>(null);

  const [instrumentTable, setInstrumentTable] = useState<string | null>(null);
  const [evidenceTable, setEvidenceTable] = useState<string | null>(null);

  const [instruments, setInstruments] = useState<InstrumentRow[]>([]);
  const [recentEvidence, setRecentEvidence] = useState<EvidenceRow[]>([]);

  const [q, setQ] = useState("");
  const [domain, setDomain] = useState<string>("All");
  const [status, setStatus] = useState<"All" | "Active" | "Archived" | "Unknown">("All");

  const [focusStats, setFocusStats] = useState<{ lastAt: string | null; total: number } | null>(
    null
  );

  const instrumentCandidates = useMemo(
    () => ["assessment_instruments", "instruments", "assessment_templates", "assessment_templates_admin"],
    []
  );
  const evidenceCandidates = useMemo(() => ["evidence", "student_evidence", "assessment_evidence"], []);

  const setParams = (next: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    router.push(`?${params.toString()}`);
  };

  const openInstrument = (id: string) => {
    setParams({ instrument: id });
  };

  const openTab = (t: TabKey) => {
    setParams({ tab: t });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setLoadHint(null);

      const instRes = await firstTableThatWorks<InstrumentRow>(
        instrumentCandidates,
        "id, label, name, short, code, domain, year_level, is_active, archived, created_at",
        { order: { col: "created_at", ascending: false }, limit: 500 }
      );

      const evRes = await firstTableThatWorks<EvidenceRow>(
        evidenceCandidates,
        "id, created_at, student_id, class_id, instrument_id, instrument_fk, notes, score, percentile, stanine",
        { order: { col: "created_at", ascending: false }, limit: 50 }
      );

      if (!alive) return;

      if (instRes.table) setInstrumentTable(instRes.table);
      if (evRes.table) setEvidenceTable(evRes.table);

      setInstruments(instRes.data ?? []);
      setRecentEvidence(evRes.data ?? []);

      if (!instRes.table) {
        setLoadHint(
          "Couldn’t find an instruments table. I tried: assessment_instruments, instruments, assessment_templates. Tell me your real table name and I’ll wire it perfectly."
        );
      }

      if (!evRes.table) {
        setLoadHint((prev) =>
          prev
            ? prev
            : "Couldn’t find an evidence table. I tried: evidence, student_evidence, assessment_evidence."
        );
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [instrumentCandidates, evidenceCandidates]);

  const domains = useMemo(() => {
    const set = new Set<string>();
    instruments.forEach((i) => {
      const d = safeStr(i.domain).trim();
      if (d) set.add(d);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [instruments]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return instruments.filter((i) => {
      if (domain !== "All" && safeStr(i.domain) !== domain) return false;

      const st = getInstrumentStatus(i) as any;
      if (status !== "All" && st !== status) return false;

      if (!query) return true;

      const hay = [
        getInstrumentTitle(i),
        i.short ?? "",
        i.code ?? "",
        i.domain ?? "",
        i.year_level ?? "",
        getInstrumentStatus(i),
        i.id,
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(query);
    });
  }, [instruments, q, domain, status]);

  const selected = useMemo(
    () => filtered.find((i) => i.id === selectedId) ?? instruments.find((i) => i.id === selectedId) ?? null,
    [filtered, instruments, selectedId]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!selected?.id || !evidenceTable) {
        setFocusStats(null);
        return;
      }
      const stats = await countByInstrument(evidenceTable, selected.id);
      if (!alive) return;
      setFocusStats(stats);
    })();
    return () => {
      alive = false;
    };
  }, [selected?.id, evidenceTable]);

  const snapshot = useMemo(() => {
    const totalInstruments = instruments.length;
    const activeCount = instruments.filter((i) => getInstrumentStatus(i) === "Active").length;
    const archivedCount = instruments.filter((i) => getInstrumentStatus(i) === "Archived").length;
    const unknownCount = instruments.filter((i) => getInstrumentStatus(i) === "Unknown").length;

    return { totalInstruments, activeCount, archivedCount, unknownCount };
  }, [instruments]);

  const topMatch = filtered[0];

  return (
    <div className="flex min-h-screen">
      <AdminLeftNav />
      <div className="flex-1">
        <AdminShell
          title="Assessments"
          subtitle="FM-style instruments dashboard • evidence • coverage • audit"
          backHref="/admin"
        >
          <section className="dash-card overflow-hidden">
            <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 p-5">
              <div className="text-[11px] font-black tracking-widest text-slate-500">
                CONTROL CENTRE • ASSESSMENTS
              </div>
              <div className="mt-2 text-4xl font-black leading-[1.05] text-slate-900 md:text-5xl">
                Instruments
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="text-sm font-extrabold text-slate-700">
                  Manage instruments, track evidence freshness, and spot gaps fast.
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Link href="/admin/assessments-admin" className="dash-btn-muted inline-flex items-center gap-2 no-underline">
                    🧾 Instruments admin
                  </Link>
                  <Link href="/admin/evidence" className="dash-btn-muted inline-flex items-center gap-2 no-underline">
                    🧠 Evidence coverage
                  </Link>
                  <Link href="/admin/instruments" className="dash-btn-muted inline-flex items-center gap-2 no-underline">
                    🧹 Instruments audit
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_220px] md:items-start">
                <div>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search instruments… (e.g., PAT Reading, NAPLAN, DIBELS)"
                    className="dash-input font-extrabold"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && topMatch?.id) openInstrument(topMatch.id);
                      if (e.key === "Escape") setQ("");
                    }}
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-extrabold text-slate-700">{filtered.length}</span> of{" "}
                    <span className="font-extrabold text-slate-700">{instruments.length}</span>
                    {topMatch ? (
                      <>
                        {" "}
                        · Top match:{" "}
                        <span className="font-extrabold text-slate-700">{getInstrumentTitle(topMatch)}</span>{" "}
                        (press <span className="font-extrabold text-slate-700">Enter</span> to focus)
                      </>
                    ) : null}
                  </div>
                  {loadHint ? <div className="mt-2 dash-alert">{loadHint}</div> : null}
                </div>

                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="dash-input font-extrabold"
                  aria-label="Domain"
                >
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d === "All" ? "All domains" : d}
                    </option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="dash-input font-extrabold"
                  aria-label="Status"
                >
                  <option value="All">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="text-xs font-black text-slate-500">Quick filters:</div>
                <ChipButton label="✅ Active" active={status === "Active"} onClick={() => setStatus("Active")} />
                <ChipButton label="🗄️ Archived" active={status === "Archived"} onClick={() => setStatus("Archived")} />
                <ChipButton label="❓ Unknown" active={status === "Unknown"} onClick={() => setStatus("Unknown")} />
                <ChipButton label="🔄 Reset" onClick={() => { setStatus("All"); setDomain("All"); setQ(""); }} />
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="dash-card">
              <div className="text-xs font-black text-slate-500">Total instruments</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{snapshot.totalInstruments}</div>
              <div className="mt-2 text-xs font-extrabold text-slate-500">
                Table: <span className="font-black text-slate-700">{instrumentTable ?? "unknown"}</span>
              </div>
            </div>
            <div className="dash-card">
              <div className="text-xs font-black text-slate-500">Active</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{snapshot.activeCount}</div>
              <div className="mt-2 text-xs font-extrabold text-slate-500">Visible in teacher workflows</div>
            </div>
            <div className="dash-card">
              <div className="text-xs font-black text-slate-500">Archived</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{snapshot.archivedCount}</div>
              <div className="mt-2 text-xs font-extrabold text-slate-500">Kept for history / reporting</div>
            </div>
            <div className="dash-card">
              <div className="text-xs font-black text-slate-500">Evidence feed</div>
              <div className="mt-1 text-2xl font-black text-slate-900">{recentEvidence.length}</div>
              <div className="mt-2 text-xs font-extrabold text-slate-500">
                Table: <span className="font-black text-slate-700">{evidenceTable ?? "unknown"}</span>
              </div>
            </div>
          </section>

          <section className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={cx("dash-btn-muted", tab === "overview" && "border-blue-300 bg-blue-50")}
              onClick={() => openTab("overview")}
            >
              📌 Overview
            </button>
            <button
              type="button"
              className={cx("dash-btn-muted", tab === "evidence" && "border-blue-300 bg-blue-50")}
              onClick={() => openTab("evidence")}
            >
              🧾 Evidence
            </button>
            <button
              type="button"
              className={cx("dash-btn-muted", tab === "audit" && "border-blue-300 bg-blue-50")}
              onClick={() => openTab("audit")}
            >
              🧹 Audit
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <MutedPill text={`FK: ${EVIDENCE_INSTRUMENT_FK}`} />
              {selected ? <Pill text={`Focused: ${getInstrumentTitle(selected)}`} /> : <Pill text="No instrument selected" />}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="dash-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-slate-900">Instrument list</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-500">
                    Click a card to focus (deep-links via <span className="font-black">?instrument=</span>)
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="dash-btn-muted"
                    onClick={() => {
                      if (filtered[0]?.id) openInstrument(filtered[0].id);
                    }}
                    disabled={!filtered.length}
                  >
                    Focus top match →
                  </button>
                  <button type="button" className="dash-btn-muted" onClick={() => setParams({ instrument: null })}>
                    Clear focus
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-extrabold text-slate-700">
                  Loading instruments…
                </div>
              ) : filtered.length === 0 ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-extrabold text-slate-700">
                  No instruments match your filters.
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {filtered.map((i) => {
                    const isSelected = selected?.id === i.id;
                    const title = getInstrumentTitle(i);
                    const st = getInstrumentStatus(i);

                    return (
                      <div
                        key={i.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openInstrument(i.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") openInstrument(i.id);
                        }}
                        className={cx(
                          "dash-card cursor-pointer transition",
                          "hover:border-blue-300",
                          isSelected && "border-blue-400 bg-white"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-black text-slate-900">{title}</div>
                            <div className="mt-1 text-xs font-extrabold text-slate-500">
                              {i.domain ? `${i.domain}` : "No domain"}{" "}
                              {i.year_level != null ? `• Year ${i.year_level}` : ""}{" "}
                              • {st}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <MutedPill text={i.short ? `Short: ${i.short}` : "Instrument"} />
                            <div className="text-[11px] font-black text-slate-400">Focus →</div>
                          </div>
                        </div>

                        <div className="mt-3 text-[11px] font-extrabold text-slate-400">{i.id}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dash-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-black text-slate-900">Focus panel</div>
                  <div className="mt-1 text-xs font-extrabold text-slate-500">
                    Selected instrument actions + quick insight
                  </div>
                </div>
                {selected ? <Pill text={getInstrumentStatus(selected)} /> : <MutedPill text="No selection" />}
              </div>

              {!selected ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-extrabold text-slate-700">
                  Pick an instrument from the list to unlock evidence + audit actions.
                </div>
              ) : (
                <>
                  <div className="mt-3">
                    <div className="text-xl font-black text-slate-900">{getInstrumentTitle(selected)}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.domain ? <Pill text={selected.domain} /> : <MutedPill text="No domain" />}
                      {selected.year_level != null ? <Pill text={`Year ${selected.year_level}`} /> : <MutedPill text="No year level" />}
                      {selected.short ? <MutedPill text={`Short: ${selected.short}`} /> : null}
                      {selected.code ? <MutedPill text={`Code: ${selected.code}`} /> : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-black text-slate-500">Latest evidence</div>
                      <div className="mt-1 text-sm font-black text-slate-900">
                        {focusStats?.lastAt ? new Date(focusStats.lastAt).toLocaleString() : "No data (or table mismatch)"}
                      </div>
                      <div className="mt-2 text-[11px] font-extrabold text-slate-500">
                        Using FK: <span className="font-black text-slate-700">{EVIDENCE_INSTRUMENT_FK}</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-black text-slate-500">Evidence sample</div>
                      <div className="mt-1 text-sm font-black text-slate-900">
                        {focusStats ? (focusStats.total > 0 ? "≥ 1 record found" : "No match found") : "—"}
                      </div>
                      <div className="mt-2 text-[11px] font-extrabold text-slate-500">
                        (We’ll add exact counts via RPC next)
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/evidence?${encodeURIComponent(EVIDENCE_INSTRUMENT_FK)}=${encodeURIComponent(
                        selected.id
                      )}`}
                      className="dash-btn-primary inline-flex items-center gap-2 no-underline"
                    >
                      🧾 View evidence →
                    </Link>

                    <Link
                      href="/admin/instruments"
                      className="dash-btn-muted inline-flex items-center gap-2 no-underline"
                    >
                      🧹 Open audit →
                    </Link>

                    <Link
                      href="/admin/assessments-admin"
                      className="dash-btn-muted inline-flex items-center gap-2 no-underline"
                    >
                      🧾 Admin settings →
                    </Link>
                  </div>

                  <div className="mt-5">
                    {tab === "overview" ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-black text-slate-900">Overview</div>
                        <ul className="mt-2 list-disc pl-5 text-sm font-extrabold text-slate-700">
                          <li>Next: add coverage rules (stale &gt; X days per class)</li>
                          <li>Next: add “create intervention from evidence gap” button</li>
                          <li>Next: exact counts via Supabase RPC for performance</li>
                        </ul>
                      </div>
                    ) : tab === "evidence" ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-black text-slate-900">Evidence</div>
                        <div className="mt-2 text-sm font-extrabold text-slate-700">
                          Recent evidence feed is loaded at the top of this page (table:{" "}
                          <span className="font-black text-slate-900">{evidenceTable ?? "unknown"}</span>).
                          Next step is instrument-filtered feed + bulk actions.
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-sm font-black text-slate-900">Audit</div>
                        <div className="mt-2 text-sm font-extrabold text-slate-700">
                          We’ll surface duplicate names, inconsistent short codes, missing domains/year levels,
                          and “orphaned evidence” (evidence rows referencing non-existent instruments).
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="mt-4 dash-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-black text-slate-900">Recent evidence feed</div>
                <div className="mt-1 text-xs font-extrabold text-slate-500">
                  Last 50 rows (best-effort). Next we’ll add bulk actions + expandable rows.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/evidence" className="dash-btn-muted inline-flex items-center gap-2 no-underline">
                  🧠 Open coverage →
                </Link>
                <button
                  type="button"
                  className="dash-btn-muted"
                  onClick={() => setParams({ tab: "evidence" })}
                >
                  Jump to Evidence tab →
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-extrabold text-slate-700">
                Loading evidence…
              </div>
            ) : recentEvidence.length === 0 ? (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-extrabold text-slate-700">
                No evidence rows found (or evidence table mismatch).
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs font-black text-slate-500">
                      <th className="border-b border-slate-200 pb-2 pr-4">Created</th>
                      <th className="border-b border-slate-200 pb-2 pr-4">Instrument</th>
                      <th className="border-b border-slate-200 pb-2 pr-4">Student</th>
                      <th className="border-b border-slate-200 pb-2 pr-4">Score</th>
                      <th className="border-b border-slate-200 pb-2 pr-0">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvidence.map((r) => {
                      const inst =
                        (r as any)[EVIDENCE_INSTRUMENT_FK] ??
                        (r as any).instrument_id ??
                        (r as any).instrument_fk ??
                        "";
                      const created = (r.created_at ? new Date(r.created_at).toLocaleString() : "—") as string;

                      return (
                        <tr key={r.id} className="text-sm font-extrabold text-slate-800">
                          <td className="border-b border-slate-100 py-3 pr-4">{created}</td>
                          <td className="border-b border-slate-100 py-3 pr-4">
                            {inst ? (
                              <button
                                type="button"
                                className="dash-btn-muted"
                                onClick={() => openInstrument(String(inst))}
                              >
                                Focus →
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="border-b border-slate-100 py-3 pr-4">
                            {r.student_id ? <span className="text-slate-700">{r.student_id}</span> : <span className="text-slate-400">—</span>}
                          </td>
                          <td className="border-b border-slate-100 py-3 pr-4">
                            {r.score != null ? r.score : r.percentile != null ? `${r.percentile}p` : r.stanine != null ? `S${r.stanine}` : "—"}
                          </td>
                          <td className="border-b border-slate-100 py-3 pr-0">
                            {r.notes ? (
                              <span className="line-clamp-2 text-slate-700">{r.notes}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="mt-4 text-xs font-extrabold text-slate-400">
            Keyboard: <span className="font-black">Enter</span> focuses top search result •{" "}
            <span className="font-black">Esc</span> clears search
          </div>
        </AdminShell>
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<AssessmentsPageFallback />}>
      <AssessmentsPageInner />
    </Suspense>
  );
}