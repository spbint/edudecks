import { redirect } from "next/navigation";

export default function ChildDetailRedirectPage() {
  redirect("/profile");
}
