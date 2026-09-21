import Link from "next/link";
import type { MyLearnaMarketplaceResource } from "@/lib/marketplace/mylearnaCatalog";

export default function MylearnaIncludedResourceCard({
  resource,
}: {
  resource: MyLearnaMarketplaceResource;
}) {
  const detailHref = `/marketplace/mylearna/${encodeURIComponent(resource.handle)}`;
  return (
    <article className="marketplace-product-card marketplace-included-card">
      <Link
        className="marketplace-product-image"
        href={detailHref}
        aria-label={`View ${resource.title}`}
      >
        {resource.coverImageUrl ? (
          <img src={resource.coverImageUrl} alt={resource.title} />
        ) : (
          <span aria-hidden="true" />
        )}
      </Link>
      <div className="marketplace-product-card-body">
        <div className="marketplace-product-meta">
          {resource.brand} · {resource.bandLabel}
        </div>
        <h3>
          <Link href={detailHref}>{resource.title}</Link>
        </h3>
        <div className="marketplace-included-badge">Included with MyLearna Family</div>
      </div>
    </article>
  );
}
