import { NextRequest, NextResponse } from "next/server";

import {
  buildReportExportFilename,
  buildServerValidatedReportExport,
  buildServerValidatedReportExportPayload,
  recordValidatedReportExportEvent,
} from "@/lib/reportExport";
import { buildDocxFilename, generateReportDocxBuffer } from "@/lib/reportDocxExport";

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
  const format = safe(url.searchParams.get("format")).toLowerCase() === "docx" ? "docx" : "html";
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

  if (format === "docx") {
    const payload = await buildServerValidatedReportExportPayload({
      reportDocumentId,
      accessToken,
    });

    if (!payload.ok) {
      return failureResponse(payload.status, {
        error: payload.error,
        code: payload.code,
        status: payload.status,
        validation: payload.validation
          ? {
              status: payload.validation.status,
              summary: payload.validation.summary,
              nextAction: payload.validation.nextAction,
              blockers: payload.validation.blockers,
              warnings: payload.validation.warnings,
              info: payload.validation.info,
            }
          : null,
      });
    }

    const buffer = await generateReportDocxBuffer(payload.exportModel);
    const filename = buildDocxFilename(payload.exportModel);
    const bytes = new Uint8Array(buffer);
    const contentHash = await crypto.subtle.digest("SHA-256", bytes);
    const hashHex = Array.from(new Uint8Array(contentHash))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const exportEvent = await recordValidatedReportExportEvent({
      payload,
      exportFormat: "docx",
      filename,
      contentHash: hashHex,
    });

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "content-type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "content-disposition": `attachment; filename="${filename}"`,
        "x-report-export-filename": filename,
        "x-report-export-status": payload.validation.status,
        ...(exportEvent
          ? {
              "x-report-export-event-id": exportEvent.id,
              "x-report-export-created-at": exportEvent.createdAt,
            }
          : {}),
      },
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
      "content-disposition": `${mode === "download" ? "attachment" : "inline"}; filename="${result.filename || buildReportExportFilename(result.exportModel)}"`,
      "x-report-export-filename": result.filename,
      "x-report-export-status": result.validation.status,
      ...(result.exportEvent
        ? {
            "x-report-export-event-id": result.exportEvent.id,
            "x-report-export-created-at": result.exportEvent.createdAt,
          }
        : {}),
    },
  });
}
