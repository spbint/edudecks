import { normalizeAuthNextPath } from "@/lib/authRedirect";

export type MyLearnaAuthSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function buildMyLearnaAuthDestination(
  searchParams: MyLearnaAuthSearchParams = {},
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }

    if (value !== undefined) params.set(key, value);
  });

  const query = params.toString();
  return normalizeAuthNextPath(
    query ? `/my-learna?${query}` : "/my-learna",
    "/my-learna",
  );
}
