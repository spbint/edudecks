import { parseShopifyDescription } from "@/lib/shopify/description";

export default function ProductDescription({ html, fallback }: { html: string; fallback: string }) {
  const blocks = parseShopifyDescription(html, fallback);
  return <div className="marketplace-detail-description">{blocks.map((block, index) => block.type === "list"
    ? <ul key={`list-${index}`}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>
    : <p key={`paragraph-${index}`}>{block.text}</p>)}</div>;
}
