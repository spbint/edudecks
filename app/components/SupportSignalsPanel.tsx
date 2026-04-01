"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Signal = {
  student_id: string;
  student_name: string;
  class_id: string;
  signal_type: string;
  signal_detail: string;
};

type ModalState =
  | { open: false }
  | { open: true; type: string; label: string; items: Signal[] };

const SIGNAL_ORDER: Record<string, number> = {
  LOW_ASSESSMENT: 0,
  LOW_CLASSROOM: 1,
  MISSING_CLASSROOM: 2,
};

export default function SupportSignalsPanel({
  signals,
  onAddEvidence,
  onAddNote,
}: {
  signals: Signal[];
  onAddEvidence?: (studentId: string) => void;
  onAddNote?: (studentId: string) => void;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ open: false });

  const labelFor = (type: string) => {
    switch (type) {
      case "MISSING_CLASSROOM":
        return "🟦 Missing recent classroom evidence";
      case "LOW_CLASSROOM":
        return "🟠 Low recent classroom evidence (1–2)";
      case "LOW_ASSESSMENT":
        return "🔴 Low recent assessment stanines (1–2)";
      default:
        return type;
    }
  };

  const studentHref = (studentId: string) =>
    `/students/${encodeURIComponent(studentId)}`;

  const goToStudent = (studentId: string) => {
    router.push(studentHref(studentId));
  };

  const groupedSorted = useMemo(() => {
    if (!signals || signals.length === 0) return [];

    const grouped = signals.reduce<Record<string, Signal[]>>((acc, s) => {
      acc[s.signal_type] = acc[s.signal_type] || [];
      acc[s.signal_type].push(s);
      return acc;
    }, {});

    const entries = Object.entries(grouped).map(([type, items]) => {
      const sortedItems = [...items].sort((a, b) =>
        (a.student_name || "").localeCompare(b.student_name || "")
      );
      return { type, items: sortedItems, label: labelFor(type) };
    });

    entries.sort((a, b) => {
      const ao = SIGNAL_ORDER[a.type] ?? 999;
      const bo = SIGNAL_ORDER[b.type] ?? 999;
      if (ao !== bo) return ao - bo;
      return a.label.localeCompare(b.label);
    });

    return entries;
  }, [signals]);

  const closeModal = () => setModal({ open: false });

  const copyGroupToClipboard = async (label: string, items: Signal[]) => {
    const lines: string[] = [];
    lines.push(`${label} — ${items.length}`);
    lines.push("");

    for (const s of items) {
      const detail = s.signal_detail ? ` — ${s.signal_detail}` : "";
      lines.push(`• ${s.student_name}${detail}`);
    }

    const text = lines.join("\n");

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback for older browsers
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {
      // If clipboard fails silently, we do nothing (keeps UI stable).
      // You can add a toast later.
    }
  };

  if (!signals || signals.length === 0) {
    return (
      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 900 }}>This week’s support signals</div>
        <div style={{ opacity: 0.7, marginTop: 6 }}>
          No support signals detected in the selected scope.
        </div>
      </section>
    );
  }

  const ActionBtn = ({
    label,
    onClick,
    title,
  }: {
    label: string;
    onClick: () => void;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: "#fff",
        border: "1px solid #e5e5e5",
        borderRadius: 10,
        padding: "6px 10px",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );

  const PrimaryLinkBtn = ({
    children,
    onClick,
    title,
  }: {
    children: string;
    onClick: () => void;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        textDecoration: "underline",
        textUnderlineOffset: 2,
        font: "inherit",
        color: "inherit",
      }}
    >
      {children}
    </button>
  );

  return (
    <>
      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>This week’s support signals</div>

        <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
          {groupedSorted.map(({ type, items, label }) => {
            const showLimit = 6;
            const extraCount = Math.max(0, items.length - showLimit);
            const preview = items.slice(0, showLimit);

            return (
              <div
                key={type}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 10,
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>
                    {label} — {items.length}
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* Copy list */}
                    <button
                      type="button"
                      onClick={() => copyGroupToClipboard(label, items)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                        fontSize: 12,
                        opacity: 0.9,
                      }}
                      aria-label={`Copy ${label} list`}
                      title="Copy list"
                    >
                      Copy list
                    </button>

                    {/* View all */}
                    {items.length > showLimit && (
                      <button
                        type="button"
                        onClick={() => setModal({ open: true, type, label, items })}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          cursor: "pointer",
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                          fontSize: 12,
                          opacity: 0.9,
                        }}
                        aria-label={`View all students for ${label}`}
                        title="View all"
                      >
                        View all
                      </button>
                    )}
                  </div>
                </div>

                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {preview.map((s) => (
                    <li
                      key={`${type}-${s.student_id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "4px 0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Name click-through */}
                        <PrimaryLinkBtn
                          onClick={() => goToStudent(s.student_id)}
                          title="Open student profile"
                        >
                          {s.student_name}
                        </PrimaryLinkBtn>

                        {/* Detail tooltip */}
                        {s.signal_detail ? (
                          <span
                            title={s.signal_detail}
                            style={{
                              fontSize: 12,
                              opacity: 0.8,
                              border: "1px solid #e5e5e5",
                              borderRadius: 999,
                              padding: "2px 8px",
                              background: "#fff",
                              cursor: "help",
                              maxWidth: 360,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            aria-label={`Signal detail: ${s.signal_detail}`}
                          >
                            Details
                          </span>
                        ) : null}
                      </div>

                      {/* Row actions */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <ActionBtn label="Open →" onClick={() => goToStudent(s.student_id)} />

                        <ActionBtn
                          label="Add evidence"
                          onClick={() => {
                            if (onAddEvidence) onAddEvidence(s.student_id);
                            else goToStudent(s.student_id);
                          }}
                          title={
                            onAddEvidence
                              ? "Open evidence form"
                              : "Wire onAddEvidence to open evidence form (falls back to profile)"
                          }
                        />

                        <ActionBtn
                          label="Add note"
                          onClick={() => {
                            if (onAddNote) onAddNote(s.student_id);
                            else goToStudent(s.student_id);
                          }}
                          title={
                            onAddNote
                              ? "Open note form"
                              : "Wire onAddNote to open note form (falls back to profile)"
                          }
                        />
                      </div>
                    </li>
                  ))}
                </ul>

                {extraCount > 0 && (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>+{extraCount} more</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal */}
      {modal.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`All students for ${modal.label}`}
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(860px, 96vw)",
              maxHeight: "80vh",
              overflow: "hidden",
              borderRadius: 14,
              background: "#fff",
              border: "1px solid #e5e5e5",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              display: "grid",
              gridTemplateRows: "auto 1fr auto",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900 }}>
                  {modal.label} — {modal.items.length}
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Tip: click a student name or use the action buttons.
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {/* Copy list in modal */}
                <button
                  type="button"
                  onClick={() => copyGroupToClipboard(modal.label, modal.items)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 2,
                    fontSize: 12,
                    opacity: 0.9,
                  }}
                  aria-label={`Copy ${modal.label} list`}
                  title="Copy list"
                >
                  Copy list
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: "#f5f5f5",
                    border: "1px solid #e5e5e5",
                    borderRadius: 10,
                    padding: "6px 10px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                  aria-label="Close"
                >
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: 14, overflow: "auto" }}>
              <div style={{ display: "grid", gap: 10 }}>
                {modal.items.map((s) => (
                  <div
                    key={`${modal.type}-${s.student_id}`}
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 12,
                      padding: 10,
                      background: "#fafafa",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <PrimaryLinkBtn
                        onClick={() => goToStudent(s.student_id)}
                        title="Open student profile"
                      >
                        {s.student_name}
                      </PrimaryLinkBtn>

                      {s.signal_detail ? (
                        <div style={{ fontSize: 12, opacity: 0.75 }}>{s.signal_detail}</div>
                      ) : (
                        <div style={{ fontSize: 12, opacity: 0.6 }}>No detail available.</div>
                      )}
                    </div>

                    {/* Actions in modal */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <ActionBtn label="Open →" onClick={() => goToStudent(s.student_id)} />

                      <ActionBtn
                        label="Add evidence"
                        onClick={() => {
                          if (onAddEvidence) onAddEvidence(s.student_id);
                          else goToStudent(s.student_id);
                        }}
                      />

                      <ActionBtn
                        label="Add note"
                        onClick={() => {
                          if (onAddNote) onAddNote(s.student_id);
                          else goToStudent(s.student_id);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderTop: "1px solid #eee",
                fontSize: 12,
                opacity: 0.75,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>Click outside the modal to close.</div>
              <div>Copy list includes details.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
