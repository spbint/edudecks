import "server-only";

import { createPinterestPinForResource } from "@/lib/resourceFactory/pinterest.server";
import {
  publishResourceFactoryRun,
  resourceFactoryAutoPromoteEnabled,
  resourceFactoryAutoPublishEnabled,
} from "@/lib/resourceFactory/publish.server";
import { runResourceFactorySeed } from "@/lib/resourceFactory/runner.server";
import type { ResourceFactoryGenerationSeed } from "@/lib/resourceFactory/types";

export async function processResourceFactorySeed(
  seed: ResourceFactoryGenerationSeed,
) {
  const run = await runResourceFactorySeed(seed);
  if (run.status !== "ready") {
    return {
      status: run.status,
      attempts: run.attempts,
      resourceId: run.spec.resourceId,
      title: run.spec.title,
      qa: run.qa,
      published: null,
      promotion: { status: "skipped" as const },
    };
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

  return {
    status: active ? ("published" as const) : ("staged" as const),
    attempts: run.attempts,
    resourceId: run.spec.resourceId,
    title: run.spec.title,
    qa: run.qa,
    published,
    promotion,
  };
}
