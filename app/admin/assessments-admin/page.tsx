"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type MasterTable = "assessment_instruments" | "assessments";

type NormalizedAssessment = {
  id: string;
  code?: string | null;
  name: string;
  domain?: string | null;
  score_type?: string | null;
  year_level?: number | null;
  visible?: boolean | null;
};

type Capabilities = {
  table: MasterTable | null;
  hasId: boolean;
  hasName: boolean;
  hasCode: boolean;
  hasDomain: boolean;
  hasScoreType: boolean;
  hasYearLevel: boolean;
  visibilityCol: "is_visible" | "visible" | "is_active" | null;
  colName: "name" | "instrument_name" | null;
  colCode: "instrument_code" | null;
};

const DOMAINS = ["Reading", "Writing", "Maths", "Spelling", "Other"];
const SCORE_TYPES = ["Numeric", "Rubric", "Scale", "Yes/No"];

export default function AssessmentsAdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [caps, setCaps] = useState<Capabilities>({
    table: null,
    hasId: false,
    hasName: false,
    hasCode: false,
    hasDomain: false,
    hasScoreType: false,
    hasYearLevel: false,
    visibilityCol: null,
    colName: null,
    colCode: null,
  });

  const [rows, setRows] = useState<NormalizedAssessment[]>([]);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [scoreType, setScoreType] = useState(SCORE_TYPES[0]);
  const [yearLevel, setYearLevel] = useState<string>("");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const guard = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) window.location.href = "/";
    };
    guard();
  }, []);

  const trySelect = async (table: MasterTable, select: string) => {
    const { data, error } = await supabase.from(table).select(select).limit(1);
    return { data, error };
  };

  const probeTable = async (): Promise<Capabilities> => {
    const candidateTables: MasterTable[] = ["assessment_instruments", "assessments"];

    for (const table of candidateTables) {
      const base = await trySelect(table, "id");
      if (base.error) continue;

      const nameAsName = await trySelect(table, "id, name");
      const nameAsInstrumentName = await trySelect(table, "id, instrument_name");

      const colName =
        !nameAsName.error ? "name" : !nameAsInstrumentName.error ? "instrument_name" : null;

      if (!colName) continue;

      const hasCode = !(await trySelect(table, "id, instrument_code")).error;
      const hasDomain = !(await trySelect(table, "id, domain")).error;
      const hasScoreType = !(await trySelect(table, "id, score_type")).error;
      const hasYearLevel = !(await trySelect(table, "id, year_level")).error;

      const hasIsVisible = !(await trySelect(table, "id, is_visible")).error;
      const hasVisible = !(await trySelect(table, "id, visible")).error;
      const hasIsActive = !(await trySelect(table, "id, is_active")).error;

      const visibilityCol = hasIsVisible
        ? "is_visible"
        : hasVisible
        ? "visible"
        : hasIsActive
        ? "is_active"
        : null;

      const colCode = hasCode ? "instrument_code" : null;

      return {
        table,
        hasId: true,
        hasName: true,
        hasCode,
        hasDomain,
        hasScoreType,
        hasYearLevel,
        visibilityCol,
        colName,
        colCode,
      };
    }

    return {
      table: null,
      hasId: false,
      hasName: false,
      hasCode: false,
      hasDomain: false,
      hasScoreType: false,
      hasYearLevel: false,
      visibilityCol: null,
      colName: null,
      colCode: null,
    };
  };

  const normalizeRows = (c: Capabilities, data: any[]): NormalizedAssessment[] => {
    if (!c.table || !c.colName) return [];

    return (data ?? []).map((r: any) => {
      const id = String(r.id);

      const nameKey = c.colName;
      const codeKey = c.colCode;

      const nm =
        String(nameKey ? r[nameKey as keyof typeof r] ?? "" : "").trim() || "(unnamed)";

      const cd =
        codeKey ? (r[codeKey as keyof typeof r] ?? null) : null;

      const dom = c.hasDomain ? (r.domain ?? null) : null;
      const st = c.hasScoreType ? (r.score_type ?? null) : null;
      const yl = c.hasYearLevel ? (r.year_level ?? null) : null;

      const vis =
        c.visibilityCol != null ? (r[c.visibilityCol] ?? null) : null;

      return {
        id,
        name: nm,
        code: cd,
        domain: dom,
        score_type: st,
        year_level: yl,
        visible: vis,
      };
    });
  };

  const loadAll = async () => {
    setLoading(true);
    setErr("");

    const c = await probeTable();
    setCaps(c);

    if (!c.table || !c.colName) {
      setRows([]);
      setErr("No valid assessment table found.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from(c.table).select("*");

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    setRows(normalizeRows(c, data as any[]));
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>Assessments Admin</h1>

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div>
          {rows.map((r) => (
            <div key={r.id} style={{ padding: 8 }}>
              {r.name}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}