export type ShopifyDescriptionBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function decodeEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function cleanText(value: string) {
  return decodeEntities(value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim());
}

export function parseShopifyDescription(descriptionHtml: string, fallback: string): ShopifyDescriptionBlock[] {
  const blocks: ShopifyDescriptionBlock[] = [];
  const blockPattern = /<(p|ul)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(descriptionHtml.trim()))) {
    if (match[1].toLowerCase() === "ul") {
      const items = [...match[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => cleanText(item[1])).filter(Boolean);
      if (items.length) blocks.push({ type: "list", items });
    } else {
      const text = cleanText(match[2]);
      if (text) blocks.push({ type: "paragraph", text });
    }
  }
  if (blocks.length) return blocks;

  const lines = fallback.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items: string[] = [];
  for (const line of lines) {
    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) items.push(cleanText(bullet[1]));
    else if (items.length) { blocks.push({ type: "list", items: items.splice(0) }); blocks.push({ type: "paragraph", text: cleanText(line) }); }
    else blocks.push({ type: "paragraph", text: cleanText(line) });
  }
  if (items.length) blocks.push({ type: "list", items });
  return blocks;
}
