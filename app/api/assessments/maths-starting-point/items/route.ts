import { NextResponse } from "next/server";
import type { MyLearnaAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessTypes";
import { hasStartingPointPreviewApiAccess } from "@/lib/clean/assessments/interactivePlayer/startingPointPreviewApi.server";
import {
  NUMBER_OPERATIONS_BOUNDARY_CLUSTERS,
  NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS,
  NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS,
  NUMBER_OPERATIONS_SEARCH_CLUSTERS,
} from "@/lib/clean/assessments/placement/numberOperationsP0Items";

export const runtime = "nodejs";

const CONTINUA = new Set([
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
]);
const POOLS = new Set(["anchor", "reserve", "search", "boundary"]);

export function toAnswerSafeStartingPointItem(
  item: MyLearnaAssessmentItem,
): MyLearnaAssessmentItem {
  const presentationTags = (item.analytics?.tags ?? []).filter(
    (tag) =>
      /^p\d+$/i.test(tag) ||
      tag.includes("accessible-form-required"),
  );
  return {
    id: item.id,
    version: item.version,
    status: item.status,
    skill: { id: "starting-point-current", name: "Maths question" },
    difficulty: item.difficulty,
    template: item.template,
    prompt: item.prompt,
    stimulus: item.stimulus,
    response: {
      type: item.response.type,
      ...(item.response.options
        ? {
            options: item.response.options.map((option) => ({
              id: option.id,
              label: option.label,
              value: option.label ?? String(option.value ?? ""),
            })),
          }
        : {}),
    },
    feedback: {
      correct: "Response recorded.",
      incorrect: "Response recorded.",
    },
    ...(presentationTags.length
      ? { analytics: { tags: presentationTags } }
      : {}),
  };
}

function clusterFor(pool: string, poolKey: string) {
  if (pool === "anchor") {
    return NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS[
      poolKey as keyof typeof NUMBER_OPERATIONS_EXECUTABLE_ANCHOR_CLUSTERS
    ];
  }
  if (pool === "reserve") {
    const item = NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS[
      poolKey as keyof typeof NUMBER_OPERATIONS_RESERVE_ANCHOR_ITEMS
    ];
    return item ? [item] : undefined;
  }
  if (pool === "search") {
    return NUMBER_OPERATIONS_SEARCH_CLUSTERS[
      poolKey as keyof typeof NUMBER_OPERATIONS_SEARCH_CLUSTERS
    ];
  }
  return NUMBER_OPERATIONS_BOUNDARY_CLUSTERS[
    poolKey as keyof typeof NUMBER_OPERATIONS_BOUNDARY_CLUSTERS
  ];
}

export async function GET(request: Request) {
  if (!(await hasStartingPointPreviewApiAccess())) {
    return NextResponse.json({ ok: false, error: "Preview access required." }, { status: 403 });
  }

  const url = new URL(request.url);
  const continuum = url.searchParams.get("continuum") ?? "";
  const pool = url.searchParams.get("pool") ?? "";
  const pLevel = Number(url.searchParams.get("pLevel"));
  const itemIndex = Number(url.searchParams.get("itemIndex"));

  if (
    !CONTINUA.has(continuum) ||
    !POOLS.has(pool) ||
    !Number.isInteger(pLevel) ||
    pLevel < 1 ||
    pLevel > 10 ||
    !Number.isInteger(itemIndex) ||
    itemIndex < 0 ||
    itemIndex > 10
  ) {
    return NextResponse.json({ ok: false, error: "Invalid question request." }, { status: 400 });
  }

  const poolKey = `${continuum}-p${pLevel}`;
  const items = clusterFor(pool, poolKey);
  if (!items?.length) {
    return NextResponse.json({ ok: false, error: "Question set unavailable." }, { status: 404 });
  }
  const item = items[itemIndex];
  if (!item) {
    return NextResponse.json({ ok: false, error: "Question unavailable." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    item: toAnswerSafeStartingPointItem(item),
    itemCount: items.length,
  });
}
