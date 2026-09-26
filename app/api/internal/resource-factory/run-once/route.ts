import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import {
  publishResourceFactoryRun,
  resourceFactoryAutoPromoteEnabled,
  resourceFactoryAutoPublishEnabled,
} from "@/lib/resourceFactory/publish.server";
import { createPinterestPinForResource } from "@/lib/resourceFactory/pinterest.server";
import { runResourceFactorySeed } from "@/lib/resourceFactory/runner.server";
import type {
  ResourceFactoryDifficulty,
  ResourceFactoryGenerationSeed,
  ResourceFactoryType,
} from "@/lib/resourceFactory/types";

export const runtime = "nodejs";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function validResourceType(value: unknown): value is ResourceFactoryType {
  return ["practice", "revision", "skill-check", "challenge"].includes(clean(value));
}

function validDifficulty(value: unknown): value is ResourceFactoryDifficulty {
  return ["foundation", "developing", "secure", "challenge"].includes(clean(value));
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const skill = clean(body.skill);
  const strand = clean(body.strand);
  const yearLevels = Array.isArray(body.yearLevels)
    ? body.yearLevels.map(clean).filter(Boolean)
    : [];
  const resourceType = validResourceType(body.resourceType)
    ? body.resourceType
    : "practice";
  const difficulty = validDifficulty(body.difficulty)
    ? body.difficulty
    : "secure";
  const questionCount = Number(body.questionCount ?? 16);

  if (!skill || !strand || !yearLevels.length || !Number.isInteger(questionCount)) {
    return NextResponse.json({ error: "invalid_seed" }, { status: 400 });
  }
  if (questionCount < 4 || questionCount > 40) {
    return NextResponse.json({ error: "question_count_out_of_range" }, { status: 400 });
  }

  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  const slug =
    slugify(clean(body.slug) || `${yearLevels[0]}-${skill}`) ||
    `worksheet-${suffix.toLowerCase()}`;
  const seed: ResourceFactoryGenerationSeed = {
    resourceId: clean(body.resourceId) || `MYL-AUTO-MATH-${suffix}`,
    slug,
    yearLevels,
    strand,
    skill,
    resourceType,
    difficulty,
    questionCount,
  };

  const run = await runResourceFactorySeed(seed);
  if (run.status !== "ready") {
    return NextResponse.json(
      {
        status: run.status,
        attempts: run.attempts,
        resourceId: run.spec.resourceId,
        qa: run.qa,
      },
      { status: 422 },
    );
  }

  const active = resourceFactoryAutoPublishEnabled();
  const published = await publishResourceFactoryRun({
    jobId: crypto.randomUUID(),
    spec: run.spec,
    qa: run.qa,
    worksheetPdf: run.worksheetPdf,
    answerPdf: run.answerPdf,
    active,
  });

  let promotion:
    | { status: "skipped" }
    | { status: "created"; pinId: string; pinLink: string }
    | { status: "failed"; error: string } = { status: "skipped" };

  if (active && resourceFactoryAutoPromoteEnabled()) {
    try {
      const pin = await createPinterestPinForResource({
        detailHref: published.detailHref,
        imageUrl: published.pinterestImageUrl,
        title: run.spec.title,
        metadata: published.metadata,
      });
      promotion = {
        status: "created",
        pinId: pin.pinId,
        pinLink: pin.pinLink,
      };
    } catch (error) {
      promotion = {
        status: "failed",
        error: error instanceof Error ? error.message : "Pinterest promotion failed.",
      };
    }
  }

  return NextResponse.json({
    status: active ? "published" : "staged",
    attempts: run.attempts,
    resourceId: run.spec.resourceId,
    title: run.spec.title,
    qa: {
      factualScore: run.qa.factualScore,
      answerScore: run.qa.answerScore,
      qualityScore: run.qa.qualityScore,
      issueCount: run.qa.issues.length,
    },
    published,
    promotion,
  });
}
