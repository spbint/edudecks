import "server-only";

export function proofResponseHeaders(contentType = "text/plain; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "Vercel-CDN-Cache-Control": "no-store",
    "Vary": "Cookie, Authorization",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
  };
}
export function proofUnavailable(status: number) {
  return new Response("Assessment proof unavailable.", {
    status, headers: proofResponseHeaders(),
  });
}
