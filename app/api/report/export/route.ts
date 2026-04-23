import { NextRequest, NextResponse } from "next/server";

import { buildServerValidatedReportExport } from "@/lib/reportExport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function readBearerToken(request: NextRequest) {
  const header = safe(request.headers.get("authorization"));
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return safe(header.slice(7));
}

function failureResponse(
  status: number,
  body: Record<string, unknown>,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reportDocumentId =
    safe(url.searchParams.get("reportDocumentId")) ||
    safe(url.searchParams.get("report_document_id")) ||
    safe(url.searchParams.get("documentId"));
  const mode = url.searchParams.get("mode") === "download" ? "download" : "open";
  const accessToken = readBearerToken(request);

  if (!reportDocumentId) {
    return failureResponse(400, {
      error: "A reportDocumentId query parameter is required.",
      code: "missing_report_document_id",
    });
  }

  if (!accessToken) {
    return failureResponse(401, {
      error: "A signed-in access token is required for report export.",
      code: "unauthorized",
    });
  }

  const result = await buildServerValidatedReportExport({
    reportDocumentId,
    accessToken,
    mode,
  });

  if (!result.ok) {
    return failureResponse(result.status, {
      error: result.error,
      code: result.code,
      status: result.status,
      validation: result.validation
        ? {
            status: result.validation.status,
            summary: result.validation.summary,
            nextAction: result.validation.nextAction,
            blockers: result.validation.blockers,
            warnings: result.validation.warnings,
            info: result.validation.info,
          }
        : null,
    });
  }

  return new NextResponse(result.html, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${result.filename}"`,
      "x-report-export-filename": result.filename,
      "x-report-export-status": result.validation.status,
    },
  });
}
