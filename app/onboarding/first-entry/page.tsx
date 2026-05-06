import { redirect } from "next/navigation";

export default function OnboardingFirstEntryRedirectPage() {
  redirect("/profile");
}
