import EmailAuthPage from "@/app/components/EmailAuthPage";
import type { Metadata } from "next";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Sign In to MyLearna | Homeschool Record Keeping",
  description:
    "Sign in to MyLearna to continue your homeschool record keeping, planning, portfolio, and reporting workflow.",
  path: "/login",
});

export default function LoginPage() {
  return <EmailAuthPage mode="login" />;
}
