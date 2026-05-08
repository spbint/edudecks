import EmailAuthPage from "@/app/components/EmailAuthPage";
import { redirect } from "next/navigation";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";

export default async function LoginPage() {
  const user = await getAuthenticatedRouteUser();

  if (user) {
    redirect("/my-day");
  }

  return <EmailAuthPage />;
}
