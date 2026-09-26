import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  createResourceFactoryJob,
  updateResourceFactoryJob,
} from "@/lib/resourceFactory/jobs.server";
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
    const jobId = await createResourceFactoryJob(seed);
    if (!jobId) {
      results.push({
        status: "skipped",
        resourceId: seed.resourceId,
        reason: "already_recorded",
      });
      continue;
    }

    try {
      await updateResourceFactoryJob({
        jobId,
        status: "generating",
      });

      const result = await processResourceFactorySeed(seed);
      const jobStatus =
        result.status === "published"
          ? result.promotion.status === "created"
            ? "promoted"
            : "published"
          : result.status === "staged"
            ? "staged"
            : "qa_failed";

      await updateResourceFactoryJob({
        jobId,
        status: jobStatus,
        attemptCount: result.attempts,
        qaReport: result.qa,
        marketplaceResourceId:
          result.published?.marketplaceResourceId ?? null,
        lastError:
          result.promotion.status === "failed"
            ? result.promotion.error
            : null,
      });

      results.push({
        ...result,
        jobId,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Resource Factory tick failed.";

      await updateResourceFactoryJob({
        jobId,
        status: "failed",
        lastError: message,
      }).catch(() => undefined);

      results.push({
        status: "failed",
        jobId,
        resourceId: seed.resourceId,
        skill: seed.skill,
        error: message,
      });
    }
  }

  return NextResponse.json({
    status: "complete",
    planned: seeds.length,
    results,
  });
}
