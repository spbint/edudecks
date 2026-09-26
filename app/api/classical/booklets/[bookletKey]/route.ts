import { buildClassicalBookletPdfResponse } from "@/lib/clean/resources/classicalBookletPdf.server";

export const runtime = "nodejs";
export const revalidate = 86400;

export async function GET(
  _request: Request,
  context: { params: Promise<{ bookletKey: string }> },
) {
  const { bookletKey } = await context.params;
  return buildClassicalBookletPdfResponse(bookletKey);
}
