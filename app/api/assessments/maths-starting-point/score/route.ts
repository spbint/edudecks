import { NextResponse } from "next/server";
import { hasStartingPointPreviewApiAccess } from "@/lib/clean/assessments/interactivePlayer/startingPointPreviewApi.server";
import { scoreAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessScoring";
import { NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY } from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";

export const runtime = "nodejs";

const itemsById = new Map(
  NUMBER_OPERATIONS_CUSTOMER_ROUTE_ITEM_REGISTRY.map((entry) => [
    entry.item.id,
    entry.item,
  ]),
);

export async function POST(request: Request) {
  if (!(await hasStartingPointPreviewApiAccess())) {
    return NextResponse.json({ ok: false, error: "Preview access required." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid answer request." }, { status: 400 });
  }

  const itemId = String(body.itemId ?? "").trim();
  const itemVersion = Number(body.itemVersion);
  const selectedOptionIds = Array.isArray(body.selectedOptionIds)
    ? body.selectedOptionIds.map((value) => String(value)).slice(0, 20)
    : [];
  const responseValue =
    body.responseValue === undefined
      ? undefined
      : String(body.responseValue).slice(0, 160);
  const timeSpentSeconds = Math.max(
    1,
    Math.min(3600, Math.round(Number(body.timeSpentSeconds) || 1)),
  );
  const item = itemsById.get(itemId);

  if (!item || item.version !== itemVersion) {
    return NextResponse.json({ ok: false, error: "Question version unavailable." }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    response: scoreAssessmentItem(
      item,
      selectedOptionIds,
      timeSpentSeconds,
      responseValue,
    ),
  });
}
