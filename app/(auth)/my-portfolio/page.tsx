import CleanPortfolioWorkspace from "@/app/components/clean/CleanPortfolioWorkspace";
import FamilyPortfolioWorkspace from "@/app/components/FamilyPortfolioWorkspace";
import { isCleanAppEnabled } from "@/lib/clean/featureFlags";

export default function MyPortfolioPage() {
  if (isCleanAppEnabled()) {
    return <CleanPortfolioWorkspace />;
  }

  return <FamilyPortfolioWorkspace />;
}
