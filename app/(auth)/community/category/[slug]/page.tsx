import { redirect } from "next/navigation";

type LegacyCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyCommunityCategoryPage({
  params,
}: LegacyCategoryPageProps) {
  const { slug } = await params;
  redirect(`/community/${encodeURIComponent(slug)}`);
}
