import { redirect } from "next/navigation";
import { loadThreadRouteMeta } from "@/lib/communityForum";

type LegacyThreadPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyCommunityThreadPage({
  params,
}: LegacyThreadPageProps) {
  const { id } = await params;
  const meta = await loadThreadRouteMeta(id);
  redirect(meta?.href || "/community");
}
