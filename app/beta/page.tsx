import type { Metadata } from "next";
import BetaInterestPage from "@/app/beta/BetaInterestPage";

export const metadata: Metadata = {
  title: "Join the MyLearna Beta",
};

export default function BetaPage() {
  return <BetaInterestPage />;
}
