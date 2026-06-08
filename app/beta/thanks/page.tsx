import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Start with MyLearna",
};

type StaleThanksRedirectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildStartFreeRedirect(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  const source = firstParam(searchParams.source).trim() || "stale-thanks-redirect";

  params.set("source", source);

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "source" || key === "status") continue;

    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item) params.append(key, item);
    }
  }

  return `/start-free?${params.toString()}`;
}

export default async function StaleThanksRedirectPage({ searchParams }: StaleThanksRedirectPageProps) {
  redirect(buildStartFreeRedirect((await searchParams) ?? {}));
}
