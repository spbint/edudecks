import { promises as dns } from "node:dns";
import type { DnsLookup } from "@/lib/intelligence/sources/urlSecurity";
import {
  resolveAndValidateUrl,
  UrlSecurityError,
} from "@/lib/intelligence/sources/urlSecurity";
import type {
  SourceExtractionFailureCode,
  SourceExtractionStatus,
  SourcePreviewMetadata,
} from "@/lib/intelligence/sources/types";

export const METADATA_EXTRACTOR_VERSION = "mylearna-intelligence-metadata-v1";
export const DEFAULT_MAX_REDIRECTS = 4;
export const DEFAULT_REQUEST_TIMEOUT_MS = 8_000;
export const DEFAULT_MAX_RESPONSE_BYTES = 1_000_000;

export type FetchImplementation = (input: string, init?: RequestInit) => Promise<Response>;
export type RobotsChecker = (url: URL) => Promise<boolean>;

const defaultDnsLookup: DnsLookup = async (hostname, options) => {
  const addresses = await dns.lookup(hostname, options);
  return addresses.map((entry) => ({ address: entry.address, family: entry.family as 4 | 6 }));
};

export class MetadataExtractionError extends Error {
  readonly status: SourceExtractionStatus;
  readonly code: SourceExtractionFailureCode;

  constructor(
    status: SourceExtractionStatus,
    code: SourceExtractionFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "MetadataExtractionError";
    this.status = status;
    this.code = code;
  }
}

type ExtractorOptions = {
  fetchImpl?: FetchImplementation;
  lookup?: DnsLookup;
  robotsChecker?: RobotsChecker;
  now?: () => Date;
  maxRedirects?: number;
  requestTimeoutMs?: number;
  maxResponseBytes?: number;
};

function text(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function decodeEntities(value: string | null) {
  if (!value) return null;
  return text(
    value
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">"),
  );
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return decodeEntities(match?.[1] ?? null);
}

function metaContent(html: string, selectors: string[]) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = attribute(tag, "name") ?? attribute(tag, "property");
    if (key && selectors.some((selector) => key.toLowerCase() === selector)) {
      const content = attribute(tag, "content");
      if (content) return content;
    }
  }
  return null;
}

function linkHref(html: string, relation: string) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const rel = attribute(tag, "rel")?.toLowerCase().split(/\s+/) ?? [];
    if (rel.includes(relation)) return attribute(tag, "href");
  }
  return null;
}

function pageTitle(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities(match?.[1] ?? null);
}

async function safeMetadataUrl(
  raw: string | null,
  baseUrl: URL,
  lookup: DnsLookup,
) {
  if (!raw) return null;
  try {
    const resolved = new URL(raw, baseUrl);
    await resolveAndValidateUrl(resolved.toString(), lookup);
    return resolved.toString();
  } catch {
    return null;
  }
}

function isBlockedResponse(status: number) {
  return status === 401 || status === 402 || status === 403 || status === 407 || status === 429 || status === 451;
}

function extractionErrorFromSecurity(error: UrlSecurityError) {
  return new MetadataExtractionError(
    "blocked",
    error.code === "malformed_url" ? "malformed_url" : "blocked_host",
    error.message,
  );
}

async function fetchWithTimeout(
  fetchImpl: FetchImplementation,
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if ((error as { name?: string })?.name === "AbortError") {
      throw new MetadataExtractionError("timed_out", "timed_out", "The source request timed out.");
    }
    throw new MetadataExtractionError("failed", "network_error", "The source could not be fetched.");
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseText(response: Response, maxBytes: number) {
  const declaredLength = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new MetadataExtractionError("too_large", "too_large", "The source response is too large.");
  }

  if (!response.body) {
    const body = await response.text();
    if (new TextEncoder().encode(body).byteLength > maxBytes) {
      throw new MetadataExtractionError("too_large", "too_large", "The source response is too large.");
    }
    return body;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    try {
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        total += next.value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new MetadataExtractionError("too_large", "too_large", "The source response is too large.");
        }
        chunks.push(next.value);
      }
    } catch (error) {
      if (error instanceof MetadataExtractionError) throw error;
      throw new MetadataExtractionError("failed", "network_error", "The source response could not be read.");
    }
  } finally {
    reader.releaseLock();
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

function robotsDisallows(robots: string, pathname: string) {
  let applies = false;
  const rules: Array<{ allow: boolean; path: string }> = [];
  for (const rawLine of robots.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      applies = value === "*";
    } else if (applies && key === "disallow" && value) {
      rules.push({ allow: false, path: value });
    } else if (applies && key === "allow" && value) {
      rules.push({ allow: true, path: value });
    }
  }
  const matching = rules.filter((rule) => pathname.startsWith(rule.path));
  if (!matching.length) return false;
  return !matching.sort((a, b) => b.path.length - a.path.length)[0].allow;
}

async function defaultRobotsChecker(
  url: URL,
  dependencies: {
    fetchImpl: FetchImplementation;
    lookup: DnsLookup;
    timeoutMs: number;
    maxBytes: number;
  },
) {
  const robotsUrl = new URL("/robots.txt", url.origin);
  await resolveAndValidateUrl(robotsUrl.toString(), dependencies.lookup);
  let response: Response;
  try {
    response = await fetchWithTimeout(
      dependencies.fetchImpl,
      robotsUrl.toString(),
      { redirect: "error", headers: { accept: "text/plain" } },
      dependencies.timeoutMs,
    );
  } catch {
    return false;
  }
  if (response.status === 404 || response.status === 410) return true;
  if (!response.ok || isBlockedResponse(response.status)) return false;
  let robots: string;
  try {
    robots = await readResponseText(response, dependencies.maxBytes);
  } catch {
    return false;
  }
  return !robotsDisallows(robots, `${url.pathname}${url.search}`);
}

export function failureMetadata(
  originalUrl: string,
  error: unknown,
  now: () => Date = () => new Date(),
): SourcePreviewMetadata {
  const extractionError = error instanceof MetadataExtractionError
    ? error
    : new MetadataExtractionError("failed", "metadata_error", "We could not extract a preview from this source.");
  return {
    originalUrl,
    finalUrl: null,
    canonicalUrl: null,
    title: null,
    description: null,
    provider: null,
    previewImageUrl: null,
    faviconUrl: null,
    contentType: null,
    fetchedAt: null,
    extractionAttemptedAt: now().toISOString(),
    extractionStatus: extractionError.status,
    extractorVersion: METADATA_EXTRACTOR_VERSION,
    failureCode: extractionError.code,
    failureMessage: extractionError.message,
  };
}

export async function extractMetadata(originalUrl: string, options: ExtractorOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const lookup = options.lookup ?? defaultDnsLookup;
  const now = options.now ?? (() => new Date());
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const maxBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;

  let current: URL;
  try {
    current = (await resolveAndValidateUrl(originalUrl, lookup)).url;
  } catch (error) {
    throw error instanceof UrlSecurityError ? extractionErrorFromSecurity(error) : error;
  }

  const robotsChecker = options.robotsChecker ?? ((url: URL) =>
    defaultRobotsChecker(url, { fetchImpl, lookup, timeoutMs, maxBytes: Math.min(maxBytes, 128_000) }));
  let redirects = 0;
  let response: Response;

  while (true) {
    if (!(await robotsChecker(current))) {
      throw new MetadataExtractionError("blocked", "blocked_by_robots", "This source does not allow automated preview fetching.");
    }
    try {
      await resolveAndValidateUrl(current.toString(), lookup);
    } catch (error) {
      throw error instanceof UrlSecurityError ? extractionErrorFromSecurity(error) : error;
    }
    response = await fetchWithTimeout(
      fetchImpl,
      current.toString(),
      {
        redirect: "manual",
        headers: {
          accept: "text/html",
          "user-agent": "MyLearnaIntelligencePreview/1.0 (+https://mylearna.com)",
        },
      },
      timeoutMs,
    );

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new MetadataExtractionError("failed", "http_error", "The source returned an invalid redirect.");
      }
      if (redirects >= maxRedirects) {
        throw new MetadataExtractionError("failed", "too_many_redirects", "The source redirected too many times.");
      }
      let next: URL;
      try {
        next = new URL(location, current);
        await resolveAndValidateUrl(next.toString(), lookup);
      } catch (error) {
        throw error instanceof UrlSecurityError ? extractionErrorFromSecurity(error) : new MetadataExtractionError("failed", "malformed_url", "The source redirect is invalid.");
      }
      current = next;
      redirects += 1;
      continue;
    }
    break;
  }

  if (isBlockedResponse(response.status)) {
    throw new MetadataExtractionError("blocked", "blocked_response", "The source blocked automated preview fetching.");
  }
  if (!response.ok) {
    throw new MetadataExtractionError("failed", "http_error", "The source returned an error response.");
  }

  const contentType = text(response.headers.get("content-type"))?.toLowerCase() ?? null;
  if (!contentType?.startsWith("text/html")) {
    throw new MetadataExtractionError("unsupported", "unsupported_content_type", "Only HTML sources can be previewed right now.");
  }

  const html = await readResponseText(response, maxBytes);
  const finalUrl = new URL(response.url || current.toString());
  const canonicalUrl = await safeMetadataUrl(linkHref(html, "canonical"), finalUrl, lookup);
  const previewImageUrl = await safeMetadataUrl(
    metaContent(html, ["og:image", "twitter:image"]),
    finalUrl,
    lookup,
  );
  const faviconUrl = await safeMetadataUrl(
    linkHref(html, "icon") ?? linkHref(html, "shortcut icon") ?? "/favicon.ico",
    finalUrl,
    lookup,
  );
  const title = metaContent(html, ["og:title", "twitter:title"]) ?? pageTitle(html);
  const description = metaContent(html, ["og:description", "twitter:description", "description"]);
  const siteName = metaContent(html, ["og:site_name"]);
  const fetchedAt = now().toISOString();

  return {
    originalUrl,
    finalUrl: finalUrl.toString(),
    canonicalUrl,
    title,
    description,
    provider: siteName ?? finalUrl.hostname,
    previewImageUrl,
    faviconUrl,
    contentType,
    fetchedAt,
    extractionAttemptedAt: fetchedAt,
    extractionStatus: "ready" as const,
    extractorVersion: METADATA_EXTRACTOR_VERSION,
  } satisfies SourcePreviewMetadata;
}
