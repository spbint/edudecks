import { redirect } from "next/navigation";

type RedirectSearchParams = Record<string, string | string[] | undefined>;

export function buildMyLearnaRedirectPath(searchParams: RedirectSearchParams = {}) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) params.append(key, item);
      });
      return;
    }

    if (value) params.set(key, value);
  });

  const query = params.toString();
  return query ? `/my-data?${query}` : "/my-data";
}

export default async function MyLearnaPage({
  searchParams,
}: {
  searchParams?: Promise<RedirectSearchParams>;
}) {
  redirect(buildMyLearnaRedirectPath((await searchParams) ?? {}));
}
