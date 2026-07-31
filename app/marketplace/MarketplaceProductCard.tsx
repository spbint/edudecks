import Link from "next/link";
import type { ShopifyProductSummary } from "@/lib/shopify/types";
import { formatShopifyMoney } from "@/lib/shopify/money";

export default function MarketplaceProductCard({ product }: { product: ShopifyProductSummary }) {
  const price = product.priceRange.minVariantPrice;
  const hasRange = product.priceRange.maxVariantPrice.amount !== price.amount;
  return <article className="marketplace-product-card">
    <Link className="marketplace-product-image" href={`/marketplace/products/${encodeURIComponent(product.handle)}`} aria-label={`View ${product.title}`}>
      {product.featuredImage ? <img src={product.featuredImage.url} alt={product.featuredImage.altText || product.title} /> : <span aria-hidden="true" />}
    </Link>
    <div className="marketplace-product-card-body">
      <div className="marketplace-product-meta">{product.productType || product.vendor || "Learning resource"}</div>
      <h3><Link href={`/marketplace/products/${encodeURIComponent(product.handle)}`}>{product.title}</Link></h3>
      <div><span className="marketplace-price">{formatShopifyMoney(price)}{hasRange ? " and up" : ""}</span></div>
      <div className="marketplace-product-meta" role="status">{product.availableForSale ? "Available" : "Currently unavailable"}</div>
    </div>
  </article>;
}

