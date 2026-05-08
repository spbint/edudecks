import EmailAuthPage from "@/app/components/EmailAuthPage";
import { redirect } from "next/navigation";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import { MISSING_PUBLIC_SUPABASE_ENV_MESSAGE } from "@/lib/supabaseClient";

export default async function SignupPage() {
  try {
    const user = await getAuthenticatedRouteUser();

    if (user) {
      redirect("/my-day");
    }
  } catch (error) {
    const message = String((error as { message?: unknown })?.message ?? "").trim();
    if (message && message === MISSING_PUBLIC_SUPABASE_ENV_MESSAGE) {
      return <EmailAuthPage mode="signup" />;
    }

    throw error;
  }

  return <EmailAuthPage mode="signup" />;
}
