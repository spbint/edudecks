import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPublishedAgentMarketplaceResourceByHandle,
} from "@/lib/resourceFactory/marketplace.server";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function metadataDescription(resource: Awaited<ReturnType<typeof getPublishedAgentMarketplaceResourceByHandle>>) {
  if (!resource) return "";
  const seo = resource.metadata.seo;
  if (seo && typeof seo === "object" && !Array.isArray(seo)) {
    const description = clean((seo as Record<string, unknown>).description);
    if (description) return description;
  }
  const skill = clean(resource.metadata.skill);
  return skill
    ? `A MyLearna homeschool worksheet for ${skill}.`
    : "A printable MyLearna homeschool worksheet.";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const resource = await getPublishedAgentMarketplaceResourceByHandle(
    (await params).handle,
  );
  return resource
    ? {
        title: resource.title,
        description: metadataDescription(resource),
      }
    : { title: "Worksheet not found" };
}

export default async function AgentWorksheetMarketplacePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resource = await getPublishedAgentMarketplaceResourceByHandle(
    (await params).handle,
  );
  if (!resource) notFound();

  const worksheetHref = clean(resource.metadata.worksheet_href);
  const answersHref = clean(resource.metadata.answers_href);
  const yearLevels = arrayOfStrings(resource.metadata.year_levels);
  const skill = clean(resource.metadata.skill);
  const difficulty = clean(resource.metadata.difficulty);
  const pricingState = clean(resource.metadata.pricing_state);

  return (
    <main className="marketplace-main">
      <div className="marketplace-product-detail">
        <div className="marketplace-gallery" aria-label={`${resource.title} preview`}>
          <figure>
            {resource.thumbnailUrl ? (
              <img src={resource.thumbnailUrl} alt={resource.title} />
            ) : (
              <div className="marketplace-state">Preview coming soon.</div>
            )}
          </figure>
        </div>

        <div className="marketplace-detail-panel">
          <div className="marketplace-eyebrow">MyLearna Worksheet</div>
          <h1>{resource.title}</h1>
          <div className="marketplace-included-badge marketplace-included-badge-large">
            {pricingState === "free_testing" ? "Free while we test it" : "MyLearna resource"}
          </div>

          <p className="marketplace-detail-description">
            {metadataDescription(resource)}
          </p>

          <div className="marketplace-detail-facts">
            <div>
              <strong>{yearLevels.join(", ") || "Homeschool"}</strong>
              <span>{resource.subcollection || resource.primaryCollection}</span>
            </div>
            <div>
              <strong>{skill || "Focused practice"}</strong>
              <span>{difficulty || "Mixed practice"}</span>
            </div>
            <div>
              <strong>Printable PDF</strong>
              <span>Answer key included</span>
            </div>
          </div>

          <div className="marketplace-detail-form">
            {worksheetHref ? (
              <Link className="marketplace-button" href={worksheetHref}>
                Open worksheet
              </Link>
            ) : null}
            {answersHref ? (
              <Link className="marketplace-button secondary" href={answersHref}>
                Open answer key
              </Link>
            ) : null}
            <span className="marketplace-product-meta">
              MyLearna is testing new resources free first, then expanding and pricing the
              resources families use most.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
