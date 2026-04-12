"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import FamilyHandoffNote from "@/app/components/FamilyHandoffNote";
import {
  FAMILY_SHELL_HANDOFF_QUERY_PARAM,
  resolveFamilyShellHandoff,
} from "@/lib/familyCommandHandoff";
import {
  loadFamilyWeeklyPlan,
  saveFamilyWeeklyPlan,
} from "@/lib/familyPlanner";

type ChildRecord = {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  age?: number | string;
  year_level?: string;
};

type PlannerAction = {
  id: string;
  title: string;
  description: string;
  category: "observe" | "do" | "capture" | "reflect";
  completed: boolean;
};

type SavedPlan = {
  studentId: string;
  weekKey: string;
  focusTitle: string;
  focusSummary: string;
  selectedGoal: string;
  notes: string;
  encouragement: string;
  actions: PlannerAction[];
  updatedAt: string;
};

type PlannerCalendarSyncPayload = {
  studentId: string;
  weekKey: string;
  focusTitle: string;
  focusSummary: string;
  encouragement: string;
  actions: PlannerAction[];
  updatedAt: string;
};

type PlannerCalendarSyncMap = Record<string, PlannerCalendarSyncPayload>;

const STORAGE_KEYS = {
  PLAN: "edudecks_plan",
  PLANNER_CALENDAR_SYNC: "edudecks_planner_calendar_sync_v1",
};

function safe(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function makeId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silent by design
  }
}

function getWeekKey(date = new Date()): string {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((diffDays + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function formatDate(date = new Date()): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getChildDisplayName(child: ChildRecord | null): string {
  if (!child) return "your learner";
  const full =
    safe(child.name) ||
    [safe(child.first_name), safe(child.last_name)].filter(Boolean).join(" ");
  return full || "your learner";
}

function buildActionsFromGoal(goal: string): {
  focusTitle: string;
  focusSummary: string;
  encouragement: string;
  actions: PlannerAction[];
} {
  const g = goal.toLowerCase();

  if (g.includes("writing")) {
    return {
      focusTitle: "Build confidence in writing",
      focusSummary:
        "Keep this week gentle: notice one strong idea, shape one short piece of writing, and capture one small win.",
      encouragement:
        "Tiny written moments count. A caption, sentence, label, prayer, or short retell all help the story grow.",
      actions: [
        {
          id: makeId("action"),
          title: "Notice one good idea worth keeping",
          description:
            "During reading, conversation, drawing, or play, listen for one strong idea that could become writing.",
          category: "observe",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Try one simple writing step",
          description:
            "Choose one light task: a caption, list, sentence, postcard, journal line, or short reflection.",
          category: "do",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Capture one small writing moment",
          description:
            "Take a quick note or photo in Capture so the progress is remembered, not lost.",
          category: "capture",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Reflect on what felt easier",
          description:
            "Write one short note about what helped this week: time, prompt, topic, support, or mood.",
          category: "reflect",
          completed: false,
        },
      ],
    };
  }

  if (g.includes("reading")) {
    return {
      focusTitle: "Strengthen reading rhythm",
      focusSummary:
        "Aim for warm, regular reading moments rather than long sessions. Steady rhythm matters more than intensity.",
      encouragement:
        "A calm ten minutes can do far more than a pressured hour.",
      actions: [
        {
          id: makeId("action"),
          title: "Read together once or twice",
          description:
            "Choose one or two short shared reading moments with a book, article, devotional, or read-aloud.",
          category: "do",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Notice understanding gently",
          description:
            "Ask one light question: What happened? What stood out? Why do you think that mattered?",
          category: "observe",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Capture one reading moment",
          description:
            "Record a note, quote, retell, drawing, or photo of the book and response.",
          category: "capture",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Reflect on what sparked interest",
          description:
            "Note what topic, format, time, or setting made reading feel easier this week.",
          category: "reflect",
          completed: false,
        },
      ],
    };
  }

  if (g.includes("math") || g.includes("numeracy")) {
    return {
      focusTitle: "Grow confidence in maths",
      focusSummary:
        "Keep maths practical this week: talk, notice, estimate, compare, and solve through ordinary life.",
      encouragement:
        "Confidence often grows through everyday moments — counting, measuring, timing, building, and explaining.",
      actions: [
        {
          id: makeId("action"),
          title: "Spot maths in everyday life",
          description:
            "Use cooking, money, time, sport, shopping, building, or measuring as the maths moment.",
          category: "observe",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Try one practical maths step",
          description:
            "Choose one short task with number, shape, time, pattern, or measurement.",
          category: "do",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Capture the learning moment",
          description:
            "Save a quick note, photo, or spoken explanation showing what was attempted or understood.",
          category: "capture",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Reflect on the sticking point",
          description:
            "Write one sentence about what felt easy, tricky, or worth revisiting next week.",
          category: "reflect",
          completed: false,
        },
      ],
    };
  }

  if (g.includes("science") || g.includes("inquiry")) {
    return {
      focusTitle: "Keep curiosity moving",
      focusSummary:
        "This week is about noticing, asking, testing, and recording one small piece of discovery.",
      encouragement:
        "Inquiry does not need to be elaborate. A careful observation is already meaningful learning.",
      actions: [
        {
          id: makeId("action"),
          title: "Notice something worth wondering about",
          description:
            "Choose a question from nature, weather, materials, animals, light, movement, or everyday life.",
          category: "observe",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Try one mini investigation",
          description:
            "Keep it simple: compare, sort, observe, predict, test, sketch, or describe.",
          category: "do",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Capture the discovery",
          description:
            "Take a photo, note the question, and record what was noticed or discovered.",
          category: "capture",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Reflect on the next question",
          description:
            "Write one follow-up question that could gently guide next week.",
          category: "reflect",
          completed: false,
        },
      ],
    };
  }

  if (g.includes("wellbeing") || g.includes("confidence") || g.includes("routine")) {
    return {
      focusTitle: "Support calm growth this week",
      focusSummary:
        "This week’s aim is to keep progress gentle, steady, and emotionally manageable.",
      encouragement:
        "A good week is not a perfect week. Small, steady steps still count.",
      actions: [
        {
          id: makeId("action"),
          title: "Notice one positive moment",
          description:
            "Look for one sign of calm, independence, resilience, confidence, or engagement.",
          category: "observe",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Keep one simple routine",
          description:
            "Choose one short rhythm to repeat: reading, prayer, journaling, outdoor time, tidy-up, or task start.",
          category: "do",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Capture one small win",
          description:
            "Record the moment so it becomes visible progress, not forgotten effort.",
          category: "capture",
          completed: false,
        },
        {
          id: makeId("action"),
          title: "Reflect on what helped",
          description:
            "Note what seemed to support calm, focus, or confidence this week.",
          category: "reflect",
          completed: false,
        },
      ],
    };
  }

  return {
    focusTitle: "Keep the week simple and purposeful",
    focusSummary:
      "Use this page as a calm weekly guide, not a strict plan. Choose a few meaningful actions and let the week breathe.",
    encouragement:
      "You do not need to do everything. The goal is to notice progress and keep moving gently.",
    actions: [
      {
        id: makeId("action"),
        title: "Notice one meaningful learning moment",
        description:
          "Look for something worth remembering during reading, play, discussion, creation, or everyday life.",
        category: "observe",
        completed: false,
      },
      {
        id: makeId("action"),
        title: "Try one simple learning step",
        description:
          "Pick one practical next step that fits your learner and your week.",
        category: "do",
        completed: false,
      },
      {
        id: makeId("action"),
        title: "Capture one small moment",
        description:
          "Record a note, image, or short reflection in Capture so the week builds a real story.",
        category: "capture",
        completed: false,
      },
      {
        id: makeId("action"),
        title: "Reflect before the week ends",
        description:
          "Write one short note about what worked, what mattered, or what could happen next.",
        category: "reflect",
        completed: false,
      },
    ],
  };
}

function getActionCategoryLabel(category: PlannerAction["category"]) {
  switch (category) {
    case "observe":
      return "Notice";
    case "do":
      return "Do";
    case "capture":
      return "Capture";
    case "reflect":
      return "Reflect";
    default:
      return "Action";
  }
}

export default function PlannerPage() {
  const searchParams = useSearchParams();
  const {
    workspace,
    activeLearnerId,
    setActiveLearner,
    loading: workspaceLoading,
  } = useFamilyWorkspace();
  const shellHandoff = useMemo(
    () =>
      resolveFamilyShellHandoff(
        searchParams?.get(FAMILY_SHELL_HANDOFF_QUERY_PARAM),
        "/planner"
      ),
    [searchParams]
  );

  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [activeStudentId, setActiveStudentId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [actions, setActions] = useState<PlannerAction[]>([]);
  const [focusTitle, setFocusTitle] = useState("");
  const [focusSummary, setFocusSummary] = useState("");
  const [encouragement, setEncouragement] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  const weekKey = useMemo(() => getWeekKey(), []);
  const todayLabel = useMemo(() => formatDate(), []);

  const goalFromQuery = safe(searchParams.get("goal"));
  const studentFromQuery = safe(searchParams.get("student"));

  useEffect(() => {
    const nextChildren = workspace.learners.map((learner) => ({
      id: learner.id,
      first_name: learner.label,
      name: learner.label,
      year_level: learner.yearLabel || "",
    }));
    setChildren(nextChildren);
  }, [workspace.learners]);

  useEffect(() => {
    const nextActiveId =
      studentFromQuery ||
      activeLearnerId ||
      workspace.profile.default_child_id ||
      workspace.learners[0]?.id ||
      "";
    setActiveStudentId(nextActiveId);
    if (nextActiveId) {
      setActiveLearner(nextActiveId);
    }
  }, [
    studentFromQuery,
    activeLearnerId,
    workspace.profile.default_child_id,
    workspace.learners,
    setActiveLearner,
  ]);

  useEffect(() => {
    let mounted = true;

    async function hydratePlan() {
      setLoadingPlan(true);
      setPageError("");

      const syncMap = readJson<PlannerCalendarSyncMap>(
        STORAGE_KEYS.PLANNER_CALENDAR_SYNC,
        {},
      );
      const syncPayload = activeStudentId
        ? syncMap[`${activeStudentId}:${weekKey}`]
        : undefined;

      try {
        let loadedPlan: SavedPlan | null = null;

        if (
          activeStudentId &&
          workspace.userId &&
          workspace.profile.id &&
          workspace.profile.id !== "local" &&
          !activeStudentId.startsWith("local-")
        ) {
          const dbPlan = await loadFamilyWeeklyPlan({
            familyProfileId: workspace.profile.id,
            studentId: activeStudentId,
            weekKey,
          });

          loadedPlan = dbPlan
            ? {
                studentId: activeStudentId,
                weekKey,
                focusTitle: dbPlan.focusTitle,
                focusSummary: dbPlan.focusSummary,
                selectedGoal: dbPlan.selectedGoal,
                notes: dbPlan.notes,
                encouragement: dbPlan.encouragement,
                actions: dbPlan.actions,
                updatedAt: dbPlan.updatedAt,
              }
            : null;
        } else if (activeStudentId) {
          const savedPlanMap = readJson<Record<string, SavedPlan>>(
            STORAGE_KEYS.PLAN,
            {},
          );
          loadedPlan = savedPlanMap[`${activeStudentId}:${weekKey}`] ?? null;
        }

        const initialGoal =
          goalFromQuery || loadedPlan?.selectedGoal || "Weekly family focus";
        const built = buildActionsFromGoal(initialGoal);
        const resolvedActions =
          syncPayload?.actions && syncPayload.actions.length > 0
            ? syncPayload.actions
            : loadedPlan?.actions && loadedPlan.actions.length > 0
            ? loadedPlan.actions
            : built.actions;

        if (!mounted) return;

        setSelectedGoal(initialGoal);
        setFocusTitle(
          syncPayload?.focusTitle || loadedPlan?.focusTitle || built.focusTitle,
        );
        setFocusSummary(
          syncPayload?.focusSummary ||
            loadedPlan?.focusSummary ||
            built.focusSummary,
        );
        setEncouragement(
          syncPayload?.encouragement ||
            loadedPlan?.encouragement ||
            built.encouragement,
        );
        setNotes(loadedPlan?.notes || "");
        setActions(resolvedActions);
      } catch (error: any) {
        console.error("planner hydrate failed", error);
        if (!mounted) return;
        const built = buildActionsFromGoal(goalFromQuery || "Weekly family focus");
        setSelectedGoal(goalFromQuery || "Weekly family focus");
        setFocusTitle(built.focusTitle);
        setFocusSummary(built.focusSummary);
        setEncouragement(built.encouragement);
        setNotes("");
        setActions(built.actions);
        setPageError(
          String(error?.message ?? "We could not load this week’s planner."),
        );
      } finally {
        if (mounted) {
          setLoadingPlan(false);
        }
      }
    }

    void hydratePlan();

    return () => {
      mounted = false;
    };
  }, [
    activeStudentId,
    goalFromQuery,
    weekKey,
    workspace.userId,
    workspace.profile.id,
  ]);

  const activeChild = useMemo(() => {
    return children.find((child) => child.id === activeStudentId) || null;
  }, [children, activeStudentId]);

  const completedCount = useMemo(
    () => actions.filter((action) => action.completed).length,
    [actions]
  );

  const progressPercent = useMemo(() => {
    if (actions.length === 0) return 0;
    return Math.round((completedCount / actions.length) * 100);
  }, [actions.length, completedCount]);

  function handleStudentChange(nextId: string) {
    setActiveStudentId(nextId);
    setActiveLearner(nextId);
  }

  function handleGoalRefresh(nextGoal: string) {
    const built = buildActionsFromGoal(nextGoal);
    setSelectedGoal(nextGoal);
    setFocusTitle(built.focusTitle);
    setFocusSummary(built.focusSummary);
    setEncouragement(built.encouragement);
    setActions(built.actions);
  }

  function toggleAction(actionId: string) {
    setActions((current) =>
      current.map((action) =>
        action.id === actionId
          ? { ...action, completed: !action.completed }
          : action
      )
    );
  }

  function updateActionText(
    actionId: string,
    field: "title" | "description",
    value: string
  ) {
    setActions((current) =>
      current.map((action) =>
        action.id === actionId ? { ...action, [field]: value } : action
      )
    );
  }

  function addCustomAction() {
    setActions((current) => [
      ...current,
      {
        id: makeId("action"),
        title: "Add your own family action",
        description: "Write one small next step that fits your week.",
        category: "do",
        completed: false,
      },
    ]);
  }

  function removeAction(actionId: string) {
    setActions((current) => current.filter((action) => action.id !== actionId));
  }

  async function handleSaveNow() {
    if (!activeStudentId) return;

    const payload: SavedPlan = {
      studentId: activeStudentId,
      weekKey,
      focusTitle,
      focusSummary,
      selectedGoal,
      notes,
      encouragement,
      actions,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (workspace.userId) {
        if (!workspace.profile.id || workspace.profile.id === "local") {
          throw new Error(
            "Family workspace is not ready for planner saves yet. Refresh and try again.",
          );
        }

        if (activeStudentId.startsWith("local-")) {
          throw new Error(
            "Choose a linked learner before saving this planner to the family workspace.",
          );
        }

        await saveFamilyWeeklyPlan({
          familyProfileId: workspace.profile.id,
          studentId: activeStudentId,
          createdByUserId: workspace.userId,
          weekKey,
          plan: {
            focusTitle,
            focusSummary,
            selectedGoal,
            notes,
            encouragement,
            actions,
            updatedAt: payload.updatedAt,
          },
        });
        const existing = readJson<Record<string, SavedPlan>>(STORAGE_KEYS.PLAN, {});
        existing[`${activeStudentId}:${weekKey}`] = payload;
        writeJson(STORAGE_KEYS.PLAN, existing);
        setSaveMessage("Planner saved to the family workspace.");
      } else {
        const existing = readJson<Record<string, SavedPlan>>(STORAGE_KEYS.PLAN, {});
        existing[`${activeStudentId}:${weekKey}`] = payload;
        writeJson(STORAGE_KEYS.PLAN, existing);
        setSaveMessage("Planner saved locally for this week.");
      }

      window.setTimeout(() => setSaveMessage(""), 2000);
    } catch (error: any) {
      console.error("planner save failed", error);
      setSaveMessage(
        String(error?.message ?? "We could not save this planner right now."),
      );
      window.setTimeout(() => setSaveMessage(""), 2600);
    }
  }

  function handleSendToCalendar() {
    if (!activeStudentId) return;

    const syncMap = readJson<PlannerCalendarSyncMap>(
      STORAGE_KEYS.PLANNER_CALENDAR_SYNC,
      {}
    );

    syncMap[`${activeStudentId}:${weekKey}`] = {
      studentId: activeStudentId,
      weekKey,
      focusTitle,
      focusSummary,
      encouragement,
      actions,
      updatedAt: new Date().toISOString(),
    };

    writeJson(STORAGE_KEYS.PLANNER_CALENDAR_SYNC, syncMap);
    setSyncMessage("Planner sent to calendar.");
    window.setTimeout(() => setSyncMessage(""), 2200);
  }

  const heroStudentName = getChildDisplayName(activeChild);
  const plannerStepTaken = actions.some((action) => action.completed) || Boolean(saveMessage) || Boolean(syncMessage);

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <section style={styles.heroCard}>
          <div style={styles.heroTopRow}>
            <div>
              <div style={styles.eyebrow}>Family Planner</div>
              <h1 style={styles.heroTitle}>A calm, simple plan for {heroStudentName}</h1>
              <p style={styles.heroText}>
                Keep this week light and purposeful. Choose a gentle focus, take a
                few meaningful steps, and let the story build naturally.
              </p>
            </div>

            <div style={styles.heroMetaCard}>
              <div style={styles.heroMetaLabel}>Week</div>
              <div style={styles.heroMetaValue}>{weekKey}</div>
              <div style={styles.heroMetaSub}>{todayLabel}</div>
            </div>
          </div>

          <FamilyHandoffNote handoff={shellHandoff} acted={plannerStepTaken} marginTop={18} marginBottom={14} />

          <div style={styles.heroStatsRow}>
            <div style={styles.statPill}>
              <span style={styles.statLabel}>Focus</span>
              <span style={styles.statValue}>{focusTitle || "Weekly focus"}</span>
            </div>
            <div style={styles.statPill}>
              <span style={styles.statLabel}>Progress</span>
              <span style={styles.statValue}>{progressPercent}% complete</span>
            </div>
            <div style={styles.statPill}>
              <span style={styles.statLabel}>Checklist</span>
              <span style={styles.statValue}>
                {completedCount} of {actions.length} done
              </span>
            </div>
          </div>
        </section>

        {workspaceLoading || loadingPlan ? (
          <section style={styles.card}>
            <div style={styles.cardText}>Loading this week’s planner…</div>
          </section>
        ) : null}

        {pageError ? (
          <section style={styles.errorCard}>
            {pageError}
          </section>
        ) : null}

        <section style={styles.grid}>
          <div style={styles.leftColumn}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>This week’s focus</h2>
                  <p style={styles.cardText}>
                    Keep the week pointed in one useful direction, rather than
                    trying to do everything at once.
                  </p>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Learner</label>
                  <select
                    value={activeStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    style={styles.select}
                  >
                    {children.length === 0 ? (
                      <option value="">No learner found yet</option>
                    ) : (
                      children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {getChildDisplayName(child)}
                          {safe(child.year_level) ? ` • ${safe(child.year_level)}` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>What would you like to focus on?</label>
                  <div style={styles.goalRow}>
                    <input
                      value={selectedGoal}
                      onChange={(e) => setSelectedGoal(e.target.value)}
                      placeholder="e.g. Writing confidence, reading rhythm, maths confidence"
                      style={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => handleGoalRefresh(selectedGoal || "Weekly family focus")}
                      style={styles.secondaryButton}
                    >
                      Suggest plan
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.focusBox}>
                <div style={styles.focusLabel}>Focus title</div>
                <input
                  value={focusTitle}
                  onChange={(e) => setFocusTitle(e.target.value)}
                  style={styles.focusTitleInput}
                />

                <div style={{ height: 10 }} />

                <div style={styles.focusLabel}>Focus summary</div>
                <textarea
                  value={focusSummary}
                  onChange={(e) => setFocusSummary(e.target.value)}
                  rows={3}
                  style={styles.textarea}
                />

                <div style={{ height: 10 }} />

                <div style={styles.focusLabel}>Encouragement</div>
                <textarea
                  value={encouragement}
                  onChange={(e) => setEncouragement(e.target.value)}
                  rows={2}
                  style={styles.textarea}
                />
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeaderRow}>
                <div>
                  <h2 style={styles.cardTitle}>Weekly checklist</h2>
                  <p style={styles.cardText}>
                    Aim for just a few good actions. This is a guide, not a pressure tool.
                  </p>
                </div>

                <button type="button" onClick={addCustomAction} style={styles.primaryButton}>
                  Add action
                </button>
              </div>

              <div style={styles.checklistWrap}>
                {actions.length === 0 ? (
                  <div style={styles.emptyState}>
                    No actions yet. Add one simple action to begin the week.
                  </div>
                ) : (
                  actions.map((action, index) => (
                    <div key={action.id} style={styles.actionCard}>
                      <div style={styles.actionTop}>
                        <label style={styles.checkboxRow}>
                          <input
                            type="checkbox"
                            checked={action.completed}
                            onChange={() => toggleAction(action.id)}
                            style={styles.checkbox}
                          />
                          <span style={styles.actionIndex}>{index + 1}.</span>
                          <span style={styles.categoryChip}>
                            {getActionCategoryLabel(action.category)}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeAction(action.id)}
                          style={styles.ghostDangerButton}
                        >
                          Remove
                        </button>
                      </div>

                      <input
                        value={action.title}
                        onChange={(e) =>
                          updateActionText(action.id, "title", e.target.value)
                        }
                        style={{
                          ...styles.actionTitleInput,
                          textDecoration: action.completed ? "line-through" : "none",
                          opacity: action.completed ? 0.7 : 1,
                        }}
                      />

                      <textarea
                        value={action.description}
                        onChange={(e) =>
                          updateActionText(action.id, "description", e.target.value)
                        }
                        rows={2}
                        style={{
                          ...styles.actionTextarea,
                          opacity: action.completed ? 0.7 : 1,
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h2 style={styles.cardTitle}>End-of-week note</h2>
                  <p style={styles.cardText}>
                    What mattered most this week? Capture what felt meaningful,
                    what felt easier, or what you may want to build on next.
                  </p>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Write a short reflection for the week..."
                style={styles.textarea}
              />

              <div style={styles.saveRow}>
                <button type="button" onClick={handleSaveNow} style={styles.primaryButton}>
                  Save planner
                </button>
                <button
                  type="button"
                  onClick={handleSendToCalendar}
                  style={styles.secondaryButton}
                >
                  Send to calendar
                </button>
                <Link href="/calendar" style={styles.linkButton}>
                  Open calendar
                </Link>
              </div>

              <div style={styles.messageRow}>
                <span style={styles.saveMessage}>{saveMessage}</span>
                <span style={styles.syncMessage}>{syncMessage}</span>
              </div>
            </section>
          </div>

          <aside style={styles.rightColumn}>
            <section style={styles.sideCard}>
              <div style={styles.sideEyebrow}>This week</div>
              <h3 style={styles.sideTitle}>{focusTitle || "Weekly focus"}</h3>
              <p style={styles.sideText}>{focusSummary}</p>
              <div style={styles.encouragementBox}>{encouragement}</div>
            </section>

            <section style={styles.sideCard}>
              <div style={styles.sideEyebrow}>Sync to calendar</div>
              <p style={styles.sideText}>
                When you send this planner to Calendar, your current week’s actions
                become available to drop into specific days.
              </p>
              <div style={styles.syncMiniBox}>
                <div style={styles.syncMiniTitle}>What syncs</div>
                <div style={styles.syncMiniText}>
                  Focus title, summary, encouragement, and checklist actions.
                </div>
              </div>
            </section>

            <section style={styles.sideCard}>
              <div style={styles.sideEyebrow}>Keep the week moving</div>
              <div style={styles.linkStack}>
                <Link href="/calendar" style={styles.flowLink}>
                  Go to Calendar
                  <span style={styles.flowSubtext}>Place your weekly actions into days</span>
                </Link>

                <Link href="/capture" style={styles.flowLink}>
                  Go to Capture
                  <span style={styles.flowSubtext}>Record what happened</span>
                </Link>

                <Link href="/portfolio" style={styles.flowLink}>
                  Go to Portfolio
                  <span style={styles.flowSubtext}>See the story building</span>
                </Link>

                <Link href="/reports" style={styles.flowLink}>
                  Go to Reports
                  <span style={styles.flowSubtext}>Turn evidence into a formal summary</span>
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f8fbff 0%, #f6f7fb 45%, #ffffff 100%)",
    padding: "32px 20px 48px",
  },
  shell: {
    width: "100%",
    maxWidth: 1320,
    margin: "0 auto",
  },
  heroCard: {
    background: "rgba(255,255,255,0.95)",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    borderRadius: 28,
    padding: 28,
    boxShadow: "0 18px 60px rgba(15, 23, 42, 0.08)",
    marginBottom: 22,
  },
  heroTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 10,
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 3vw, 3rem)",
    lineHeight: 1.05,
    fontWeight: 800,
    color: "#0f172a",
  },
  heroText: {
    margin: "12px 0 0",
    maxWidth: 760,
    fontSize: 16,
    lineHeight: 1.65,
    color: "#475569",
  },
  heroMetaCard: {
    minWidth: 220,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    padding: 16,
  },
  heroMetaLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
  },
  heroMetaValue: {
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
    marginTop: 6,
  },
  heroMetaSub: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 6,
  },
  heroStatsRow: {
    marginTop: 18,
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  statPill: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 999,
    padding: "10px 14px",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#64748b",
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) minmax(300px, 0.9fr)",
    gap: 22,
    alignItems: "start",
  },
  leftColumn: {
    display: "grid",
    gap: 22,
  },
  rightColumn: {
    display: "grid",
    gap: 22,
    position: "sticky",
    top: 24,
    alignSelf: "start",
  },
  card: {
    background: "#ffffff",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 12px 34px rgba(15, 23, 42, 0.05)",
  },
  errorCard: {
    background: "#fff7ed",
    border: "1px solid #fdba74",
    borderRadius: 24,
    padding: 18,
    color: "#9a3412",
    fontWeight: 700,
  },
  sideCard: {
    background: "#ffffff",
    border: "1px solid rgba(15, 23, 42, 0.08)",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 12px 34px rgba(15, 23, 42, 0.05)",
  },
  cardHeader: {
    marginBottom: 18,
  },
  cardHeaderRow: {
    marginBottom: 18,
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 800,
    color: "#0f172a",
  },
  cardText: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: 15,
    lineHeight: 1.6,
  },
  formGrid: {
    display: "grid",
    gap: 16,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#334155",
  },
  input: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
  },
  select: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
  },
  textarea: {
    width: "100%",
    borderRadius: 16,
    border: "1px solid #dbe3ee",
    padding: "14px 16px",
    fontSize: 15,
    color: "#0f172a",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.6,
    background: "#fff",
  },
  goalRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 10,
  },
  focusBox: {
    marginTop: 18,
    background: "#f8fbff",
    border: "1px solid #e2ecf7",
    borderRadius: 20,
    padding: 16,
  },
  focusLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 6,
  },
  focusTitleInput: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    border: "1px solid #dbe3ee",
    padding: "12px 14px",
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
  },
  checklistWrap: {
    display: "grid",
    gap: 14,
  },
  actionCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 16,
    background: "#fcfdff",
  },
  actionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
  },
  actionIndex: {
    fontSize: 14,
    fontWeight: 800,
    color: "#64748b",
  },
  categoryChip: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    background: "#eaf3ff",
    color: "#1d4ed8",
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 800,
  },
  actionTitleInput: {
    width: "100%",
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    outline: "none",
    background: "#fff",
    marginBottom: 10,
  },
  actionTextarea: {
    width: "100%",
    border: "1px solid #dbe3ee",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 14,
    color: "#334155",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.5,
    background: "#fff",
  },
  emptyState: {
    border: "1px dashed #cbd5e1",
    borderRadius: 18,
    padding: 22,
    textAlign: "center",
    color: "#64748b",
    background: "#f8fafc",
  },
  primaryButton: {
    appearance: "none",
    border: "none",
    background: "#0f172a",
    color: "#ffffff",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  linkButton: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#0f172a",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostDangerButton: {
    appearance: "none",
    border: "1px solid #fecaca",
    background: "#fff7f7",
    color: "#b91c1c",
    borderRadius: 12,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  saveRow: {
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  messageRow: {
    marginTop: 10,
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    minHeight: 22,
  },
  saveMessage: {
    fontSize: 14,
    color: "#0f766e",
    fontWeight: 700,
  },
  syncMessage: {
    fontSize: 14,
    color: "#1d4ed8",
    fontWeight: 700,
  },
  sideEyebrow: {
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#64748b",
    marginBottom: 10,
  },
  sideTitle: {
    margin: 0,
    fontSize: 22,
    lineHeight: 1.2,
    fontWeight: 800,
    color: "#0f172a",
  },
  sideText: {
    margin: "10px 0 0",
    fontSize: 15,
    lineHeight: 1.65,
    color: "#475569",
  },
  encouragementBox: {
    marginTop: 14,
    background: "#f8fbff",
    border: "1px solid #e2ecf7",
    borderRadius: 18,
    padding: 14,
    color: "#334155",
    lineHeight: 1.6,
    fontSize: 14,
    fontWeight: 600,
  },
  syncMiniBox: {
    marginTop: 14,
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    background: "#f8fafc",
    padding: 14,
  },
  syncMiniTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#0f172a",
    marginBottom: 6,
  },
  syncMiniText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.6,
  },
  linkStack: {
    display: "grid",
    gap: 10,
  },
  flowLink: {
    display: "block",
    border: "1px solid #dbe3ee",
    borderRadius: 16,
    padding: "14px 16px",
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 800,
  },
  flowSubtext: {
    display: "block",
    marginTop: 6,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
  },
};
