import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { planNextMathResourceFactorySeeds } from "@/lib/resourceFactory/planner.server";
import { processResourceFactorySeed } from "@/lib/resourceFactory/process.server";

export const runtime = "nodejs";
export const maxDuration = 300;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function authorised(request: Request) {
  const expected = clean(process.env.RESOURCE_FACTORY_RUN_SECRET);
  const supplied = clean(request.headers.get("authorization")).replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

function batchSize() {
  const configured = Number(process.env.RESOURCE_FACTORY_TICK_BATCH_SIZE ?? 1);
  if (!Number.isInteger(configured)) return 1;
  return Math.max(1, Math.min(3, configured));
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const seeds = await planNextMathResourceFactorySeeds(batchSize());
  if (!seeds.length) {
    return NextResponse.json({
      status: "idle",
      planned: 0,
      results: [],
    });
  }

  const results = [];
  for (const seed of seeds) {
    try {
      results.push(await processResourceFactorySeed(seed));
    } catch (error) {
      results.push({
        status: "failed",
        resourceId: seed.resourceId,
        skill: seed.skill,
        error:
          error instanceof Error
            ? error.message
            : "Resource Factory tick failed.",
      });
    }
  }

  return NextResponse.json({
    status: "complete",
    planned: seeds.length,
    results,
  });
}
