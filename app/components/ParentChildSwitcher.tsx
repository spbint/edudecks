"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const ACTIVE_STUDENT_ID_KEY = "edudecks_active_student_id";

export type ParentChildOption = {
  id: string;
  first_name?: string | null;
  preferred_name?: string | null;
  surname?: string | null;
  family_name?: string | null;
  year_level?: number | null;
  relationship_label?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
  [k: string]: any;
};

type Props = {
  onChange?: (child: ParentChildOption | null) => void;
};

/* ───────────────────────── HELPERS ───────────────────────── */

function safe(v: any) {
  return String(v ?? "").trim();
}

function isMissingColumnError(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && msg.includes("column");
}

function isMissingRelationOrColumn(err: any) {
  const msg = String(err?.message ?? "").toLowerCase();
  return msg.includes("does not exist") && (msg.includes("column") || msg.includes("relation"));
}

function isValidStudentRow(row: any): row is ParentChildOption {
  return row && typeof row === "object" && typeof row.id === "string";
}

function studentDisplayName(s: ParentChildOption | null | undefined) {
  if (!s) return "Child";
  const first = safe(s.preferred_name || s.first_name);
  const sur = safe(s.surname || s.family_name);
  return `${first}${sur ? ` ${sur}` : ""}`.trim() || "Child";
}

/* ───────────────────────── STYLES ───────────────────────── */

const S = {
  wrap: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "end",
  } as React.CSSProperties,

  selectWrap: {
    minWidth: 300,
    display: "grid",
    gap: 6,
  } as React.CSSProperties,

  label: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  } as React.CSSProperties,

  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    outline: "none",
  } as React.CSSProperties,

  btn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 900,
    cursor: "pointer",
  } as React.CSSProperties,

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #dbe1ea",
    background: "#fff",
    color: "#0f172a",
    fontSize: 12,
    fontWeight: 900,
  } as React.CSSProperties,

  warn: {
    marginTop: 10,
    borderRadius: 12,
    border: "1px solid #fde68a",
    background: "#fffbeb",
    padding: 10,
    color: "#92400e",
    fontWeight: 900,
  } as React.CSSProperties,
};

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function ParentChildSwitcher({ onChange }: Props) {
  const router = useRouter();

  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [children, setChildren] = useState<ParentChildOption[]>([]);
  const [activeId, setActiveId] = useState("");

  async function loadChildren() {
    setBusy(true);
    setErr("");

    try {
      const authResp = await supabase.auth.getUser();
      const userId = authResp.data.user?.id;

      if (!userId) {
        setChildren([]);
        setBusy(false);
        return;
      }

      const linksResp = await supabase
        .from("parent_student_links")
        .select("student_id,relationship_label,sort_order,created_at")
        .eq("parent_user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (linksResp.error) {
        if (isMissingRelationOrColumn(linksResp.error)) {
          setErr("parent_student_links table is missing. Run the SQL first.");
          setChildren([]);
          setBusy(false);
          return;
        }
        throw linksResp.error;
      }

      const links = ((linksResp.data ?? []) as unknown) as Array<{
        student_id: string;
        relationship_label?: string | null;
        sort_order?: number | null;
        created_at?: string | null;
      }>;

      if (!links.length) {
        setChildren([]);
        setBusy(false);
        onChange?.(null);
        return;
      }

      const ids = links.map((x) => x.student_id).filter(Boolean);

      const tries = [
        "id,first_name,preferred_name,surname,family_name,year_level,created_at",
        "id,first_name,preferred_name,surname,family_name,created_at",
        "id,first_name,preferred_name,surname,created_at",
        "id,first_name,preferred_name,family_name,created_at",
        "id,first_name,preferred_name,created_at",
      ];

      let students: ParentChildOption[] = [];

      for (const sel of tries) {
        const r = await supabase.from("students").select(sel).in("id", ids);

        if (!r.error) {
          const safeData = ((r.data ?? []) as unknown[]).filter(isValidStudentRow);
          students = safeData;
          break;
        }

        if (!isMissingColumnError(r.error)) throw r.error;
      }

      const merged = ids
        .map((id) => {
          const student = students.find((s) => s.id === id);
          const link = links.find((l) => l.student_id === id);
          if (!student) return null;

          return {
            ...student,
            relationship_label: link?.relationship_label ?? null,
            sort_order: link?.sort_order ?? 0,
          } as ParentChildOption;
        })
        .filter(Boolean) as ParentChildOption[];

      setChildren(merged);

      const storedActive = safe(localStorage.getItem(ACTIVE_STUDENT_ID_KEY));

      const nextActive =
        merged.find((c) => c.id === storedActive)?.id ||
        merged[0]?.id ||
        "";

      setActiveId(nextActive);

      if (nextActive) {
        localStorage.setItem(ACTIVE_STUDENT_ID_KEY, nextActive);
        onChange?.(merged.find((c) => c.id === nextActive) || null);
      } else {
        onChange?.(null);
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
      setChildren([]);
      onChange?.(null);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(id: string) {
    setActiveId(id);
    localStorage.setItem(ACTIVE_STUDENT_ID_KEY, id);
    onChange?.(children.find((c) => c.id === id) || null);
  }

  const activeChild = useMemo(
    () => children.find((c) => c.id === activeId) || null,
    [children, activeId]
  );

  return (
    <div>
      <div style={S.wrap}>
        <div style={S.selectWrap}>
          <div style={S.label}>Active child</div>

          <select
            style={S.select}
            value={activeId}
            onChange={(e) => handleChange(e.target.value)}
            disabled={busy || !children.length}
          >
            {!children.length ? <option value="">No linked children yet</option> : null}

            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {studentDisplayName(child)}
                {child.year_level != null ? ` • Year ${child.year_level}` : ""}
              </option>
            ))}
          </select>
        </div>

        {activeChild ? (
          <span style={S.chip}>{studentDisplayName(activeChild)}</span>
        ) : null}

        <button style={S.btn} onClick={() => router.push("/children")}>
          Manage children
        </button>

        <button style={S.btn} onClick={() => router.push("/children/new")}>
          Add child
        </button>
      </div>

      {err ? <div style={S.warn}>{err}</div> : null}
    </div>
  );
}