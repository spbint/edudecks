import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      error: "Submission pack export is no longer available. Use the validated report export instead.",
      code: "submission_pack_unavailable",
    },
    { status: 410 },
  );
}
