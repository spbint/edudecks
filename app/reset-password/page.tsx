import { redirect } from "next/navigation";

export default function ResetPasswordPage() {
  redirect("/login?authMessage=Passwordless%20sign-in%20is%20now%20handled%20through%20your%20email%20link.");
}
