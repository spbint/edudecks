import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const manifest = readFileSync(join(process.cwd(), "app/manifest.ts"), "utf8");
const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
const shell = readFileSync(join(process.cwd(), "app/components/clean/design-v2/MyLearnaAppShellV2.tsx"), "utf8");
const quickCapture = readFileSync(join(process.cwd(), "app/components/clean/CleanQuickCaptureWorkspace.tsx"), "utf8");
const materialize = readFileSync(join(process.cwd(), "lib/clean/generation/materialize.ts"), "utf8");

function readPngDimensions(path: string) {
  const png = readFileSync(path);
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe("installable MyLearna mobile foundation", () => {
  it("uses one canonical App Router manifest with the intended standalone app contract", () => {
    expect(existsSync(join(process.cwd(), "app/manifest.ts"))).toBe(true);
    expect(manifest).toContain('name: "MyLearna Homeschool"');
    expect(manifest).toContain('short_name: "MyLearna"');
    expect(manifest).toContain('start_url: "/my-day"');
    expect(manifest).toContain('display: "standalone"');
    expect(manifest).toContain('background_color: "#f8fafc"');
    expect(manifest).toContain('theme_color: "#1d4ed8"');
    expect(manifest).not.toContain("orientation:");
    expect(manifest).toContain('src: "/branding/mylearna-app-icon-192.png"');
    expect(manifest).toContain('sizes: "192x192"');
    expect(manifest).toContain('src: "/branding/mylearna-app-icon-512.png"');
    expect(manifest).toContain('sizes: "512x512"');
    expect(manifest).not.toContain("mylearna-watermark-150.png");
    expect(readPngDimensions(join(process.cwd(), "public/branding/mylearna-app-icon-192.png"))).toEqual({ width: 192, height: 192 });
    expect(readPngDimensions(join(process.cwd(), "public/branding/mylearna-app-icon-512.png"))).toEqual({ width: 512, height: 512 });
    expect(existsSync(join(process.cwd(), "public/branding/mylearna-app-icon-maskable-512.png"))).toBe(false);
  });

  it("keeps root app metadata and existing standalone safe-area protections", () => {
    expect(layout).toContain('manifest: "/manifest.webmanifest"');
    expect(layout).toContain('applicationName: "MyLearna Homeschool"');
    expect(layout).toContain("appleWebApp:");
    expect(layout).toContain("viewportFit: \"cover\"");
    expect(layout).toContain('themeColor: "#1d4ed8"');
    expect(shell).toContain("env(safe-area-inset-bottom");
    expect(quickCapture).toContain("env(safe-area-inset-bottom");
  });

  it("does not add offline or Calendar materialisation infrastructure", () => {
    expect(manifest).not.toMatch(/serviceWorker|workbox|next-pwa/i);
    expect(materialize).not.toContain("serviceWorker");
  });
});
