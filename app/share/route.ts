import { NextResponse } from "next/server";
import { getIntelligenceServerContext } from "@/lib/intelligence/serverAuth";
import { normalizeAuthNextPath } from "@/lib/authRedirect";
import { extractSharedHttpUrl } from "@/lib/shareIntake";

const MAX_TITLE = 180;
const MAX_TEXT = 2000;
function clean(value: string | null, max: number) {
  return (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const sharedTitle = clean(incoming.searchParams.get("title"), MAX_TITLE);
  const sharedText = clean(incoming.searchParams.get("text"), MAX_TEXT);
  const sharedUrl = extractSharedHttpUrl(incoming.searchParams.get("url"), sharedText);
  const target = new URL("/my-ideas", incoming.origin);
  if (sharedUrl) target.searchParams.set("sharedUrl", sharedUrl);
  if (sharedTitle) target.searchParams.set("sharedTitle", sharedTitle);
  if (sharedUrl || sharedTitle) target.searchParams.set("source", "share");

  const auth = await getIntelligenceServerContext();
  if (auth) return NextResponse.redirect(target);

  const next = normalizeAuthNextPath(`${target.pathname}${target.search}`, "/my-ideas");
  return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, incoming.origin));
}
