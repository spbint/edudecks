import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMylearnaMarketplaceResourceByHandle,
} from "@/lib/marketplace/mylearnaCatalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const resource = getMylearnaMarketplaceResourceByHandle((await params).handle);
  return resource
    ? {
        title: resource.title,
        description: resource.description,
      }
    : { title: "Resource not found" };
}

export default async function MylearnaMarketplaceResourcePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const resource = getMylearnaMarketplaceResourceByHandle((await params).handle);
  if (!resource) notFound();

  const cupboardHref =
    "/my-resources?add_marketplace=" +
    encodeURIComponent(resource.externalProductId) +
    "&source=marketplace";

  return (
    <main className="marketplace-main">
      <div className="marketplace-product-detail">
        <div className="marketplace-gallery" aria-label={`${resource.title} preview`}>
          <figure>
            <img src={resource.coverImageUrl} alt={resource.title} />
          </figure>
        </div>
        <div className="marketplace-detail-panel">
          <div className="marketplace-eyebrow">{resource.brand}</div>
          <h1>{resource.title}</h1>
          <div className="marketplace-included-badge marketplace-included-badge-large">
            Included with MyLearna Family
          </div>
          <p className="marketplace-detail-description">{resource.description}</p>

          <div className="marketplace-detail-facts">
            <div><strong>{resource.bandLabel}</strong><span>{resource.cycleLabel}</span></div>
            <div><strong>{resource.unitLabel}</strong><span>{resource.encounterLabel}</span></div>
            <div><strong>{resource.pageCount}-page booklet</strong><span>{resource.bigQuestion}</span></div>
          </div>

          <div className="marketplace-detail-form">
            <Link className="marketplace-button" href={cupboardHref}>
              Save to My Resource Cupboard
            </Link>
            <Link className="marketplace-button secondary" href={resource.pathwayHref}>
              Open in My Pathways
            </Link>
            <span className="marketplace-product-meta">
              No separate Marketplace purchase. This first-party curriculum resource is
              part of MyLearna Family access.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
