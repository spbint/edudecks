import type { PathwayDomainStatus } from "@/lib/clean/pathways/mathematicsNumberPrototype";

export type SubjectStrandCard = {
  key: string;
  title: string;
  description: string;
  whyItMatters: string;
  status: PathwayDomainStatus;
};
