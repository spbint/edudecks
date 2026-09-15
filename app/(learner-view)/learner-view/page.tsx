import { redirect } from "next/navigation";

export default async function LearnerViewPage({
  searchParams,
}: {
  searchParams: Promise<{ learner_id?: string | string[] }>;
}) {
  const params = await searchParams;
  const learnerId = Array.isArray(params.learner_id) ? params.learner_id[0] : params.learner_id;
  redirect(learnerId ? `/my-day?learner_id=${encodeURIComponent(learnerId)}` : "/my-day");
}
