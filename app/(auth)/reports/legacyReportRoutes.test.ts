import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import ReportsPage from "@/app/(auth)/reports/page";
import LegacyReportOutputPage from "@/app/(auth)/reports/output/page";
import LegacyReportLibraryPage from "@/app/(auth)/reports/library/page";

type LegacyPage = (props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => Promise<unknown>;

async function expectRedirect(
  Page: LegacyPage,
  searchParams: Record<string, string | string[] | undefined>,
  target: string,
) {
  redirectMock.mockClear();
  await Page({ searchParams: Promise.resolve(searchParams) });
  expect(redirectMock).toHaveBeenCalledWith(target);
}

describe("legacy report route retirement", () => {
  it("redirects /reports to My Reports", async () => {
    await expectRedirect(ReportsPage, {}, "/my-reports");
  });

  it("redirects /reports/output to My Reports and preserves learner_id", async () => {
    await expectRedirect(
      LegacyReportOutputPage,
      { learner_id: "learner-123", draftId: "draft-123", documentId: "document-123" },
      "/my-reports?learner_id=learner-123",
    );
  });

  it("redirects /reports/library to My Reports and normalizes learnerId", async () => {
    await expectRedirect(
      LegacyReportLibraryPage,
      { learnerId: "learner 456", reportDocumentId: "document-456" },
      "/my-reports?learner_id=learner%20456",
    );
  });

  it("does not propagate legacy report-document parameters", async () => {
    await expectRedirect(
      ReportsPage,
      { draftId: "draft-123", reportDocumentId: "document-123", documentId: "document-456" },
      "/my-reports",
    );
  });

  it("leaves the canonical clean reports workspace and export path intact", () => {
    const cleanWorkspace = readFileSync(
      join(process.cwd(), "app/components/clean/CleanReportsWorkspace.tsx"),
      "utf8",
    );
    const cleanExports = readFileSync(
      join(process.cwd(), "lib/clean/outputs/client.ts"),
      "utf8",
    );

    expect(cleanWorkspace).toContain("createCleanReportExport");
    expect(cleanWorkspace).not.toContain("@/lib/reportExport");
    expect(cleanExports).toContain('.from("report_exports")');
  });
});
