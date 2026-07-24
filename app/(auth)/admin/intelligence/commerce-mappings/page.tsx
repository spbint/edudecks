import { notFound } from "next/navigation";
import CommerceMappingAdminView from "@/app/components/intelligence/CommerceMappingAdminView";
import { isCommerceMappingAdminEnabled } from "@/lib/intelligence/featureFlags";

export default function CommerceMappingAdminPage() {
  if (!isCommerceMappingAdminEnabled()) notFound();
  return <CommerceMappingAdminView />;
}
