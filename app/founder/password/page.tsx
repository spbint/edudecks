import FounderPasswordForm from "./FounderPasswordForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Set MyLearna Founder password",
  robots: { index: false, follow: false, nocache: true },
};

export default function FounderPasswordPage() {
  return <FounderPasswordForm />;
}
