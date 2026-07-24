import { redirect } from "next/navigation";

type RedirectSearchParams = Record<string, string | string[] | undefined>;

export function buildMyDataRedirectPath(searchParams: RedirectSearchParams = {}) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined) params.append(key, item);
      });
      return;
    }

    if (value !== undefined) params.set(key, value);
  });

  const query = params.toString();
  return query ? `/my-learna?${query}` : "/my-learna";
}

export default async function MyDataPage({
  searchParams,
}: {
  searchParams?: Promise<RedirectSearchParams>;
}) {
  redirect(buildMyDataRedirectPath((await searchParams) ?? {}));
}
