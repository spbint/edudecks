import type { Metadata } from "next";
import CleanLearnaWorkspace from "@/app/components/clean/CleanLearnaWorkspace";
import {
  buildMyLearnaAuthDestination,
  type MyLearnaAuthSearchParams,
} from "@/lib/auth/myLearnaAuthDestination";
import { requireAuthenticatedRoute } from "@/lib/auth/serverRouteAuth";

export const metadata: Metadata = {
  title: "My Learna | MyLearna",
  description:
    "Understand what current evidence suggests, what remains unknown and what to do next for each learner.",
};

export default async function MyLearnaPage({
  searchParams,
}: {
  searchParams?: Promise<MyLearnaAuthSearchParams>;
}) {
  await requireAuthenticatedRoute(
    buildMyLearnaAuthDestination((await searchParams) ?? {}),
  );

  return <CleanLearnaWorkspace />;
}
