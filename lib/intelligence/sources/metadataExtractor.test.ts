import { describe, expect, it } from "vitest";
import {
  extractMetadata,
  MetadataExtractionError,
} from "@/lib/intelligence/sources/metadataExtractor";
import type { DnsLookup } from "@/lib/intelligence/sources/urlSecurity";

const publicAddress: DnsLookup = async () => [{ address: "93.184.216.34", family: 4 }];
const allowRobots = async () => true;

function htmlResponse(html: string, headers?: HeadersInit) {
  return new Response(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", ...headers },
  });
}

async function expectExtractionError(promise: Promise<unknown>, status: string, code: string) {
  const error = await promise.catch((value: unknown) => value);
  expect(error).toBeInstanceOf(MetadataExtractionError);
  expect((error as MetadataExtractionError).status).toBe(status);
  expect((error as MetadataExtractionError).code).toBe(code);
}

describe("secure HTML metadata extraction", () => {
  it("extracts metadata from a valid public HTML page", async () => {
    const result = await extractMetadata("https://example.com/article", {
      lookup: publicAddress,
      robotsChecker: allowRobots,
      fetchImpl: async () => htmlResponse(
        '<html><head><title>Fallback</title><meta property="og:title" content="A lesson idea"><meta property="og:description" content="Try this activity"><meta property="og:site_name" content="Example Academy"><link rel="canonical" href="/canonical"><meta property="og:image" content="/preview.png"><link rel="icon" href="/favicon.ico"></head></html>',
      ),
      now: () => new Date("2026-07-23T00:00:00.000Z"),
    });

    expect(result).toMatchObject({
      originalUrl: "https://example.com/article",
      finalUrl: "https://example.com/article",
      canonicalUrl: "https://example.com/canonical",
      title: "A lesson idea",
      description: "Try this activity",
      provider: "Example Academy",
      previewImageUrl: "https://example.com/preview.png",
      faviconUrl: "https://example.com/favicon.ico",
      contentType: "text/html; charset=utf-8",
      fetchedAt: "2026-07-23T00:00:00.000Z",
      extractionStatus: "ready",
    });
  });

  it("rejects localhost and private IPv4 addresses", async () => {
    await expectExtractionError(
      extractMetadata("http://localhost/article", { lookup: publicAddress, robotsChecker: allowRobots }),
      "blocked",
      "blocked_host",
    );
    await expectExtractionError(
      extractMetadata("http://192.168.1.10/article", { robotsChecker: allowRobots }),
      "blocked",
      "blocked_host",
    );
  });

  it("rejects private IPv6 addresses", async () => {
    await expectExtractionError(
      extractMetadata("http://[fc00::1]/article", { robotsChecker: allowRobots }),
      "blocked",
      "blocked_host",
    );
    await expectExtractionError(
      extractMetadata("http://[::1]/article", { robotsChecker: allowRobots }),
      "blocked",
      "blocked_host",
    );
  });

  it("rejects a public hostname that resolves to a private address", async () => {
    const privateDns: DnsLookup = async () => [{ address: "10.0.0.5", family: 4 }];
    await expectExtractionError(
      extractMetadata("https://public.example/article", { lookup: privateDns, robotsChecker: allowRobots }),
      "blocked",
      "blocked_host",
    );
  });

  it("revalidates redirect targets before fetching them", async () => {
    await expectExtractionError(
      extractMetadata("https://example.com/article", {
        lookup: publicAddress,
        robotsChecker: allowRobots,
        fetchImpl: async () => new Response(null, {
          status: 302,
          headers: { location: "http://127.0.0.1/private" },
        }),
      }),
      "blocked",
      "blocked_host",
    );
  });

  it("enforces the redirect limit", async () => {
    let requests = 0;
    await expectExtractionError(
      extractMetadata("https://example.com/article", {
        lookup: publicAddress,
        robotsChecker: allowRobots,
        maxRedirects: 2,
        fetchImpl: async () => {
          requests += 1;
          return new Response(null, {
            status: 302,
            headers: { location: `https://example.com/redirect-${requests}` },
          });
        },
      }),
      "failed",
      "too_many_redirects",
    );
    expect(requests).toBe(3);
  });

  it("classifies timeout and oversized responses", async () => {
    const timeoutFetch = async (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    await expectExtractionError(
      extractMetadata("https://example.com/article", {
        lookup: publicAddress,
        robotsChecker: allowRobots,
        fetchImpl: timeoutFetch,
        requestTimeoutMs: 5,
      }),
      "timed_out",
      "timed_out",
    );

    await expectExtractionError(
      extractMetadata("https://example.com/article", {
        lookup: publicAddress,
        robotsChecker: allowRobots,
        maxResponseBytes: 10,
        fetchImpl: async () => htmlResponse("too large", { "content-length": "11" }),
      }),
      "too_large",
      "too_large",
    );
  });

  it("rejects unsupported content types and malformed URLs", async () => {
    await expectExtractionError(
      extractMetadata("https://example.com/file.pdf", {
        lookup: publicAddress,
        robotsChecker: allowRobots,
        fetchImpl: async () => new Response("%PDF", { status: 200, headers: { "content-type": "application/pdf" } }),
      }),
      "unsupported",
      "unsupported_content_type",
    );
    await expectExtractionError(
      extractMetadata("javascript:alert(1)", { lookup: publicAddress, robotsChecker: allowRobots }),
      "blocked",
      "malformed_url",
    );
  });

  it("falls back to document title and hostname provider", async () => {
    const result = await extractMetadata("https://example.com/lesson", {
      lookup: publicAddress,
      robotsChecker: allowRobots,
      fetchImpl: async () => htmlResponse(
        '<html><head><title>  A useful title  </title><meta name="description" content="A useful description"><link rel="shortcut icon" href="/icon.ico"></head></html>',
      ),
    });

    expect(result.title).toBe("A useful title");
    expect(result.description).toBe("A useful description");
    expect(result.provider).toBe("example.com");
    expect(result.canonicalUrl).toBeNull();
    expect(result.faviconUrl).toBe("https://example.com/icon.ico");
  });
});
