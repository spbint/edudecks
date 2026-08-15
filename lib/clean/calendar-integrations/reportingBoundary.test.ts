import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const roots = [
  "lib/reporting",
  "lib/clean/reports",
  "lib/clean/outputs",
  "app/api/report",
  "app/api/reports",
];
const rootReportFiles = [
  "lib/reportAssembly.ts",
  "lib/reportCompletionGate.ts",
  "lib/reportDrafts.ts",
  "lib/reportEvidenceMapping.ts",
  "lib/reportExport.ts",
  "lib/reportPack.ts",
  "lib/reportSectionActions.ts",
  "lib/reportSectionAutofill.ts",
  "lib/reportTemplates.ts",
  "lib/reporting.ts",
];

function sourceFiles(path: string): string[] {
  const absolute = join(process.cwd(), path);
  if (statSync(absolute).isFile()) return [absolute];
  return readdirSync(absolute).flatMap((name) => {
    const child = join(absolute, name);
    if (statSync(child).isDirectory()) return sourceFiles(relative(process.cwd(), child));
    return /\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")
      ? [child]
      : [];
  });
}

describe("MyLearna reporting source-of-truth boundary", () => {
  it("never reads provider infrastructure as educational report data", () => {
    const files = [
      ...roots.flatMap(sourceFiles),
      ...rootReportFiles.map((file) => join(process.cwd(), file)),
    ];
    const source = files
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(source).not.toMatch(
      /calendar_provider_connections|calendar_oauth_states|calendar_item_external_links|calendar_sync_outbox|calendar_feed_subscriptions|external_event_id/,
    );
    expect(source).not.toContain("@/lib/clean/calendar-integrations/");
  });

  it("continues to assemble reports from MyLearna learning records", () => {
    const mapping = readFileSync(
      join(process.cwd(), "lib/reportEvidenceMapping.ts"),
      "utf8",
    );
    for (const table of [
      "learning_plans",
      "learning_experiences",
      "evidence_items",
      "reviews",
      "report_sections",
    ]) {
      expect(mapping).toContain(`"${table}"`);
    }
  });
});
