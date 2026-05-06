import { redirect } from "next/navigation";

export default function AuthorityRedirectPage() {
  redirect("/my-reports");
}
