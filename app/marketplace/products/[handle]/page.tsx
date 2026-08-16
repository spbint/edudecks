import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/shopify/client";
import AddToCartPanel from "./AddToCartPanel";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  try { const product = await getProduct((await params).handle); return product ? { title: product.seo.title || product.title, description: product.seo.description || product.description || undefined } : { title: "Product not found" }; } catch { return { title: "Product" }; }
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const handle = (await params).handle;
  let product: Awaited<ReturnType<typeof getProduct>> = null;
  try {
    product = await getProduct(handle);
  } catch { notFound(); }
  if (!product) notFound();
  const vendor = /^(?:https?:\/\/)?(?:www\.)?gofindgod\.com\/?$/i.test(product.vendor.trim())
    ? ""
    : product.vendor.trim();
  const gallery = product.images.length ? product.images : product.featuredImage ? [product.featuredImage] : [];
  return <main className="marketplace-main"><div className="marketplace-product-detail"><div className="marketplace-gallery" aria-label={`${product.title} images`}>{gallery.map((image, index) => <figure key={`${image.url}-${index}`}><img src={image.url} alt={image.altText || (index ? `${product.title} view ${index + 1}` : product.title)} /></figure>)}</div><div className="marketplace-detail-panel"><div className="marketplace-eyebrow">{product.productType || "Learning resource"}</div><h1>{product.title}</h1>{vendor ? <p className="marketplace-product-meta">By {vendor}</p> : null}<p className="marketplace-detail-description">{product.description || "A practical resource for meaningful learning."}</p><AddToCartPanel product={product} /></div></div></main>;
}
