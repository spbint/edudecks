import { redirect } from "next/navigation";

type CaptureAliasPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CaptureAliasPage({
  searchParams,
}: CaptureAliasPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams || {})) {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string" && entry) {
          nextSearchParams.append(key, entry);
        }
      });
      continue;
    }

    if (typeof value === "string" && value) {
      nextSearchParams.set(key, value);
    }
  }

  const nextQuery = nextSearchParams.toString();
  redirect(nextQuery ? `/my-capture?${nextQuery}` : "/my-capture");
}
