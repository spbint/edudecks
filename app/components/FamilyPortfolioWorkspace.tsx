"use client";

import React, { useEffect, useState } from "react";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import { useFamilyWorkspace } from "@/app/components/FamilyWorkspaceProvider";
import {
  type HomeSurfaceState,
  type LearnerOption,
  LearnerSelector,
} from "@/app/components/home/HomeOverviewComponents";
import { loadEvidenceEntriesWithVariants } from "@/lib/familyEvidence";
import {
  PortfolioActionsRow,
  PortfolioEmptyState,
  PortfolioGrid,
  type PortfolioActionItem,
  type PortfolioCardItem,
} from "@/app/components/portfolio/PortfolioOverviewComponents";

type EvidenceRow = {
  id: string;
  title?: string | null;
  summary?: string | null;
  note?: string | null;
  occurred_on?: string | null;
  learning_area?: string | null;
  evidence_type?: string | null;
  image_url?: string | null;
  created_at?: string | null;
};

const EVIDENCE_SELECTS = [
  "id,title,summary,note,occurred_on,learning_area,evidence_type,image_url,created_at",
];

const PLACEHOLDER_ITEMS: PortfolioCardItem[] = [
  {
    id: "placeholder-1",
    title: "Science experiment",
    meta: "12 Apr • Exploration",
    tag: "Science",
    type: "Evidence",
    thumbnailLabel: "Observation",
    thumbnailTone:
      "bg-[linear-gradient(135deg,rgba(219,234,254,0.98)_0%,rgba(191,219,254,0.94)_55%,rgba(224,242,254,0.9)_100%)]",
  },
  {
    id: "placeholder-2",
    title: "Nature journal",
    meta: "11 Apr • Reflection",
    tag: "Inquiry",
    type: "Reflection",
    thumbnailLabel: "Journal",
    thumbnailTone:
      "bg-[linear-gradient(135deg,rgba(233,213,255,0.98)_0%,rgba(221,214,254,0.94)_50%,rgba(243,232,255,0.92)_100%)]",
  },
  {
    id: "placeholder-3",
    title: "Reading milestone",
    meta: "9 Apr • Achievement",
    tag: "Literacy",
    type: "Achievement",
    thumbnailLabel: "Milestone",
    thumbnailTone:
      "bg-[linear-gradient(135deg,rgba(220,252,231,0.98)_0%,rgba(187,247,208,0.94)_50%,rgba(254,249,195,0.9)_100%)]",
  },
  {
    id: "placeholder-4",
    title: "Maths pattern work",
    meta: "8 Apr • Practice",
    tag: "Numeracy",
    type: "Evidence",
    thumbnailLabel: "Practice",
  },
  {
    id: "placeholder-5",
    title: "Creative writing",
    meta: "6 Apr • Reflection",
    tag: "Creative",
    type: "Reflection",
    thumbnailLabel: "Draft",
  },
  {
    id: "placeholder-6",
    title: "Family presentation",
    meta: "4 Apr • Achievement",
    tag: "Communication",
    type: "Achievement",
    thumbnailLabel: "Share",
  },
  {
    id: "placeholder-7",
    title: "Bible memory work",
    meta: "2 Apr • Reflection",
    tag: "Bible",
    type: "Reflection",
    thumbnailLabel: "Memory",
  },
  {
    id: "placeholder-8",
    title: "Sketchbook study",
    meta: "31 Mar • Evidence",
    tag: "Arts",
    type: "Evidence",
    thumbnailLabel: "Studio",
  },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function formatPortfolioDate(value?: string | null) {
  const trimmed = safe(value);
  if (!trimmed) return "Recently added";

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "Recently added";
  return parsed.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function portfolioType(value?: string | null): PortfolioCardItem["type"] {
  const normalized = safe(value).toLowerCase();
  if (normalized.includes("reflect") || normalized.includes("journal") || normalized.includes("voice")) {
    return "Reflection";
  }
  if (normalized.includes("achieve") || normalized.includes("award") || normalized.includes("milestone")) {
    return "Achievement";
  }
  return "Evidence";
}

function mapEvidenceToCard(row: EvidenceRow): PortfolioCardItem {
  const type = portfolioType(row.evidence_type);
  const tag = safe(row.learning_area) || "Learning";
  const dateLabel = formatPortfolioDate(row.occurred_on || row.created_at);

  return {
    id: row.id,
    title: safe(row.title) || safe(row.summary) || "Learning moment",
    meta: `${dateLabel} • ${type}`,
    tag,
    type,
    imageUrl: safe(row.image_url) || null,
    thumbnailLabel: tag,
  };
}

export default function FamilyPortfolioWorkspace() {
  const { workspace, activeLearner, loading: workspaceLoading, setActiveLearner } = useFamilyWorkspace();
  const [items, setItems] = useState<PortfolioCardItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const learnerOptions: LearnerOption[] = workspace.learners.map((learner) => ({
    id: learner.id,
    label: learner.label,
    note: learner.yearLabel || "Learner",
  }));

  const hasLearners = workspace.learners.length > 0;
  const hasActiveLearner = Boolean(activeLearner);
  const canonicalReady =
    Boolean(workspace.userId) &&
    workspace.storageMode === "database" &&
    Boolean(workspace.profile?.id) &&
    workspace.profile.id !== "local" &&
    Boolean(activeLearner?.id);

  useEffect(() => {
    let mounted = true;

    async function hydratePortfolio() {
      if (!hasActiveLearner) {
        if (mounted) {
          setItems([]);
          setLoadingItems(false);
        }
        return;
      }

      if (!canonicalReady || !activeLearner?.id) {
        if (mounted) {
          setItems(PLACEHOLDER_ITEMS);
          setLoadingItems(false);
        }
        return;
      }

      try {
        setLoadingItems(true);

        const rows = await loadEvidenceEntriesWithVariants<EvidenceRow>(EVIDENCE_SELECTS, {
          studentId: activeLearner.id,
          limit: 12,
        });

        if (!mounted) return;
        setItems(rows.map(mapEvidenceToCard));
      } catch {
        if (!mounted) return;
        setItems(PLACEHOLDER_ITEMS);
      } finally {
        if (mounted) setLoadingItems(false);
      }
    }

    void hydratePortfolio();

    return () => {
      mounted = false;
    };
  }, [activeLearner?.id, canonicalReady, hasActiveLearner]);

  const portfolioState: HomeSurfaceState = workspaceLoading || loadingItems
    ? "loading"
    : !hasLearners || !hasActiveLearner
      ? "empty"
      : canonicalReady
        ? items.length
          ? "live"
          : "empty"
        : "placeholder";

  const learnerSelectorState: HomeSurfaceState = workspaceLoading
    ? "loading"
    : hasLearners
      ? workspace.storageMode === "database"
        ? "derived"
        : "placeholder"
      : "empty";

  const activeLearnerName = activeLearner?.label || "your learner";
  const showEmptyState = portfolioState === "empty" && hasActiveLearner;
  const showGrid = portfolioState === "loading" || portfolioState === "placeholder" || portfolioState === "live";

  const actionItems: PortfolioActionItem[] = [
    {
      href: "/capture",
      icon: "CP",
      title: "Capture Evidence",
      note: hasActiveLearner
        ? `Add a fresh learning moment for ${activeLearnerName}.`
        : "Choose a learner to start capturing.",
      cta: "Capture",
    },
    {
      href: "/my-plan",
      icon: "PL",
      title: "Open My Plan",
      note: hasActiveLearner
        ? `See what is active next for ${activeLearnerName}.`
        : "Planning stays visible once a learner is selected.",
      cta: "Plan",
    },
    {
      href: "/my-reports",
      icon: "RP",
      title: "Build My Report",
      note: hasActiveLearner
        ? "Turn the strongest moments into a clearer report."
        : "Reports become stronger as evidence grows.",
      cta: "Report",
    },
    {
      href: "/my-progress",
      icon: "PG",
      title: "Check My Progress",
      note: hasActiveLearner
        ? `Review progress signals for ${activeLearnerName}.`
        : "Progress follows the learner in focus.",
      cta: "Progress",
    },
  ];

  return (
    <FamilyTopNavShell
      subtitle="My Portfolio"
      heroTitle="My Portfolio"
      heroText="A visual record of learning over time."
      hideHeroAside={true}
    >
      <div className="grid gap-5 pb-14">
        <LearnerSelector
          familyName={workspace.profile.family_display_name || "Your family"}
          learners={learnerOptions}
          activeLearnerId={activeLearner?.id}
          onSelectLearner={setActiveLearner}
          state={learnerSelectorState}
        />

        {showGrid ? (
          <PortfolioGrid items={items} state={portfolioState} />
        ) : null}

        {showEmptyState ? <PortfolioEmptyState learnerName={activeLearnerName} /> : null}

        <PortfolioActionsRow items={actionItems} />
      </div>
    </FamilyTopNavShell>
  );
}
