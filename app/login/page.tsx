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
  return (
    <>
      <div
        role="status"
        style={{
          background: "#17204B",
          color: "#FFFFFF",
          padding: "12px 20px",
          textAlign: "center",
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.5,
        }}
      >
        MyLearna Homeschool Australia opens January 2027. Existing families can still sign in below.
      </div>
      <EmailAuthPage mode="login" />
    </>
  );
}
