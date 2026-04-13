import { NextRequest, NextResponse } from "next/server";
import { buildSubmissionPack } from "@/lib/reportPack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safe(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function readBearerToken(request: NextRequest) {
  const header = safe(request.headers.get("authorization"));
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

export async function GET(request: NextRequest) {
  try {
    const draftId = safe(request.nextUrl.searchParams.get("draftId"));
    if (!draftId) {
      return NextResponse.json(
        { error: "A draftId query parameter is required." },
        { status: 400 },
      );
    }

    const accessToken = readBearerToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { error: "A signed-in access token is required for submission pack export." },
        { status: 401 },
      );
    }

    const pack = await buildSubmissionPack({ draftId, accessToken });

    return new NextResponse(Buffer.from(pack.bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${pack.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Submission pack route failed:", error);

    const message = safe(error?.message) || "Failed to generate submission pack.";
    const status =
      message.toLowerCase().includes("draft") && message.toLowerCase().includes("not found")
        ? 404
        : message.toLowerCase().includes("learner")
          ? 400
          : message.toLowerCase().includes("token") || message.toLowerCase().includes("session")
            ? 401
            : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
