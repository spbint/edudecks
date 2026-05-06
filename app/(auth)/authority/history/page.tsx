import { redirect } from "next/navigation";

export default function AuthorityHistoryRedirectPage() {
  redirect("/my-reports");
}
