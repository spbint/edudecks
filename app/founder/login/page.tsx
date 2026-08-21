import { redirect } from "next/navigation";
import FounderLoginForm from "./FounderLoginForm";
import { getFounderAccessContext } from "@/lib/clean/founder/founderAccess";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "MyLearna Founder login",
  robots: { index: false, follow: false, nocache: true },
};

export default async function FounderLoginPage() {
  const access = await getFounderAccessContext();
  if (access.decision === "allowed") redirect("/founder");
  return <FounderLoginForm />;
}
