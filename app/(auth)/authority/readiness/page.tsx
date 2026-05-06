import { redirect } from "next/navigation";

export default function AuthorityReadinessRedirectPage() {
  redirect("/my-reports");
}
