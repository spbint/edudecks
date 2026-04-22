"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { HomeSurfaceState } from "@/app/components/home/HomeOverviewComponents";
import {
  type CurriculumOutcomeMeta,
  type FrameworkPreset,
  findOutcomeMeta,
} from "@/lib/curriculumFrameworks";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const LABEL_TEXT = "text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500";
const CARD_TITLE = "text-[15px] font-semibold leading-[1.35] text-slate-950";
const BODY_TEXT = "text-[14px] leading-6 text-slate-600";
const META_TEXT = "text-[13px] leading-5 text-slate-500";
const CTA_TEXT = "text-[14px] font-semibold";

function surfaceTone(state: HomeSurfaceState) {
  if (state === "empty") return "border-dashed border-slate-200 bg-slate-50/80";
  if (state === "placeholder") return "border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(248,250,252,0.96)_100%)]";
  return "border-slate-200 bg-white";
}

function statusTone(status: "understood" | "in_progress" | "needs_support") {
  if (status === "understood") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "needs_support") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function outcomeChipLabel(meta: CurriculumOutcomeMeta) {
  return `${meta.subjectTitle} · ${meta.strandTitle}`;
}

export function CurriculumTagPills({
  preset,
  outcomeIds,
  emptyLabel = "No linked outcomes yet",
}: {
  preset: FrameworkPreset;
  outcomeIds: string[];
  emptyLabel?: string;
}) {
  const metas = outcomeIds
    .map((id) => findOutcomeMeta(preset, id))
    .filter((item): item is CurriculumOutcomeMeta => item !== null);

  if (!metas.length) {
    return <div className={META_TEXT}>{emptyLabel}</div>;
  }

  const visible = metas.slice(0, 2);
  const overflow = metas.length - visible.length;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((meta) => (
        <span
          key={meta.id}
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-600"
          title={`${meta.code} ${meta.label}`}
        >
          {outcomeChipLabel(meta)}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-600">
          +{overflow} more
        </span>
      ) : null}
    </div>
  );
}

export function CurriculumAttachPanel({
  preset,
  selectedOutcomeIds,
  onApply,
  onCancel,
  state,
}: {
  preset: FrameworkPreset | null;
  selectedOutcomeIds: string[];
  onApply: (outcomeIds: string[]) => void;
  onCancel: () => void;
  state: HomeSurfaceState;
}) {
  const [draft, setDraft] = useState<string[]>(selectedOutcomeIds);
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    preset?.subjects[0]?.id || "",
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDraft(selectedOutcomeIds);
  }, [selectedOutcomeIds]);

  useEffect(() => {
    setSelectedSubjectId(preset?.subjects[0]?.id || "");
  }, [preset]);

  const filteredSubjects = useMemo(() => {
    if (!preset) return [];
    const trimmed = query.trim().toLowerCase();
    return preset.subjects
      .map((subject) => ({
        ...subject,
        strands: subject.strands
          .map((strand) => ({
            ...strand,
            outcomes: strand.outcomes.filter((outcome) => {
              if (!trimmed) return true;
              return (
                outcome.code.toLowerCase().includes(trimmed) ||
                outcome.label.toLowerCase().includes(trimmed) ||
                strand.title.toLowerCase().includes(trimmed)
              );
            }),
          }))
          .filter((strand) => strand.outcomes.length),
      }))
      .filter((subject) => subject.strands.length);
  }, [preset, query]);

  const selectedSubject =
    filteredSubjects.find((subject) => subject.id === selectedSubjectId) ??
    filteredSubjects[0] ??
    null;

  function toggleOutcome(outcomeId: string) {
    setDraft((prev) =>
      prev.includes(outcomeId)
        ? prev.filter((id) => id !== outcomeId)
        : [...prev, outcomeId],
    );
  }

  if (!preset) {
    return (
      <div className={cx("rounded-[20px] border px-4 py-4", surfaceTone("empty"))}>
        <div className={CARD_TITLE}>Choose framework first</div>
        <div className={`mt-2 ${BODY_TEXT}`}>
          Choose a curriculum framework in My Settings to begin linking outcomes.
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx(
        "grid gap-4 rounded-[22px] border px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
        surfaceTone(state),
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-1">
          <div className={LABEL_TEXT}>Add curriculum</div>
          <div className={CARD_TITLE}>Select linked outcomes</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 ${CTA_TEXT} text-slate-700 transition hover:bg-slate-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className={`inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 ${CTA_TEXT} text-white transition hover:bg-slate-800`}
          >
            Apply
          </button>
        </div>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search outcomes"
        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300"
      />

      <div className="flex flex-wrap gap-2">
        {preset.subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => setSelectedSubjectId(subject.id)}
            className={cx(
              "inline-flex items-center rounded-full border px-3 py-2 text-[13px] font-semibold transition",
              subject.id === selectedSubject?.id
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {subject.title}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {selectedSubject?.strands.map((strand) => (
          <div key={strand.id} className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
            <div className={CARD_TITLE}>{strand.title}</div>
            <div className="mt-3 grid gap-2">
              {strand.outcomes.map((outcome) => {
                const checked = draft.includes(outcome.code);
                return (
                  <label
                    key={outcome.code}
                    className="grid cursor-pointer gap-1 rounded-[16px] border border-slate-200 bg-white px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOutcome(outcome.code)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-slate-900">{outcome.code}</div>
                        <div className={META_TEXT}>{outcome.label}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={META_TEXT}>
        {draft.length} linked outcome{draft.length === 1 ? "" : "s"} selected
      </div>
    </div>
  );
}

export function InheritedCurriculumPanel({
  preset,
  outcomeIds,
  outcomeStatusById,
  onEdit,
  onStatusChange,
  state,
}: {
  preset: FrameworkPreset | null;
  outcomeIds: string[];
  outcomeStatusById: Record<string, "understood" | "in_progress" | "needs_support">;
  onEdit: () => void;
  onStatusChange?: (outcomeId: string, status: "understood" | "in_progress" | "needs_support") => void;
  state: HomeSurfaceState;
}) {
  const metas = (preset ? outcomeIds.map((id) => findOutcomeMeta(preset, id)) : []).filter(
    (item): item is CurriculumOutcomeMeta => item !== null,
  );

  return (
    <section
      className={cx(
        "grid gap-4 rounded-[24px] border px-5 py-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]",
        surfaceTone(state),
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <div className={LABEL_TEXT}>Linked curriculum</div>
          <div className={CARD_TITLE}>Review inherited outcomes</div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 ${CTA_TEXT} text-slate-700 transition hover:bg-slate-50`}
        >
          {metas.length ? "Edit curriculum" : "Add curriculum"}
        </button>
      </div>

      {metas.length ? (
        <div className="grid gap-3">
          <CurriculumTagPills preset={preset!} outcomeIds={outcomeIds} />
          {onStatusChange ? (
            <div className="grid gap-3">
              {metas.map((meta) => (
                <div key={meta.id} className="grid gap-2 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
                  <div className="grid gap-1">
                    <div className="text-[13px] font-semibold text-slate-900">{meta.code}</div>
                    <div className={META_TEXT}>{meta.label}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["understood", "in_progress", "needs_support"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onStatusChange(meta.id, status)}
                        className={cx(
                          "inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                          outcomeStatusById[meta.id] === status
                            ? statusTone(status)
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        {status === "understood"
                          ? "Understood"
                          : status === "needs_support"
                            ? "Needs support"
                            : "In progress"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className={BODY_TEXT}>No linked outcomes yet.</div>
      )}
    </section>
  );
}
