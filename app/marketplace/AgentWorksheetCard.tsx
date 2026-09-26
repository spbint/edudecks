import Link from "next/link";

import type { AgentMarketplaceResource } from "@/lib/resourceFactory/marketplace.server";

function arrayOfStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default function AgentWorksheetCard({
  resource,
}: {
  resource: AgentMarketplaceResource;
}) {
  const detailHref = `/marketplace/worksheets/${encodeURIComponent(resource.handle)}`;
  const yearLevels = arrayOfStrings(resource.metadata.year_levels);
  const pricingState = clean(resource.metadata.pricing_state);

  return (
    <article className="marketplace-product-card marketplace-included-card">
      <Link
        className="marketplace-product-image"
        href={detailHref}
        aria-label={`View ${resource.title}`}
      >
        {resource.thumbnailUrl ? (
          <img src={resource.thumbnailUrl} alt={resource.title} />
        ) : (
          <span aria-hidden="true" />
        )}
      </Link>
      <div className="marketplace-product-card-body">
        <div className="marketplace-product-meta">
          MyLearna · {yearLevels.join(", ") || resource.subcollection || "Homeschool"}
        </div>
        <h3>
          <Link href={detailHref}>{resource.title}</Link>
        </h3>
        <div className="marketplace-included-badge">
          {pricingState === "free_testing" ? "Free worksheet" : "MyLearna worksheet"}
        </div>
      </div>
    </article>
  );
}
