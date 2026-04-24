import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

import {
  buildServerValidatedReportExportPayload,
  recordValidatedReportExportEvent,
} from "@/lib/reportExport";
import { buildPdfFilename, generateReportPdfBuffer } from "@/lib/reportPdfExport";

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

function failureResponse(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function sha256Hex(bytes: Uint8Array) {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const reportDocumentId =
    safe(url.searchParams.get("reportDocumentId")) ||
    safe(url.searchParams.get("report_document_id")) ||
    safe(url.searchParams.get("documentId"));
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

  const buffer = await generateReportPdfBuffer(payload.exportModel);
  const bytes = new Uint8Array(buffer);
  const filename = buildPdfFilename(payload.exportModel);
  const exportEvent = await recordValidatedReportExportEvent({
    payload,
    exportFormat: "pdf",
    filename,
    contentHash: await sha256Hex(bytes),
  });

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/pdf",
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
