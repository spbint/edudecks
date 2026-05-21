import { NextResponse } from "next/server";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";

export async function GET() {
  try {
    const user = await getAuthenticatedRouteUser();

    if (!user) {
      return NextResponse.json({ ready: false }, { status: 401 });
    }

    return NextResponse.json({ ready: true });
  } catch {
    return NextResponse.json({ ready: false }, { status: 401 });
  }
}
