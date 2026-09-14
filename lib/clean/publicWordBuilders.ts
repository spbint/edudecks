import fs from "node:fs";
import path from "node:path";
import { ENGLISH_STRAND_WORKSPACE_BUILDERS } from "@/lib/clean/pathways/englishPathways";

export type PublicWordBuilder = {
  code: string;
  slug: string;
  title: string;
  stepKey: string;
  strand: string;
  stage: string;
  category: "PHONICS_CVC" | "AFFIX_SPELLING" | "ROOTS";
  board: string;
  image: string;
  pinTitle: string;
  description: string;
  link: string;
  pdf: string;
  href: string;
  meaning?: string;
  skillFocus?: string;
};

type PublicPathwayStep = { stepKey?: string; meaning?: string; skillFocus?: string };

const manifestPath = path.join(process.cwd(), "public/pinterest/word-builders/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PublicWordBuilder[];

export const PUBLIC_WORD_BUILDERS = manifest.map((item) => {
  const workspace = ENGLISH_STRAND_WORKSPACE_BUILDERS[item.strand]?.(item.stage as never);
  const step = (workspace?.stages.flatMap((stage) => stage.steps) as PublicPathwayStep[]).find((candidate) => candidate.stepKey === item.stepKey);
  return { ...item, meaning: step?.meaning, skillFocus: step?.skillFocus };
});

export function getPublicWordBuilder(slug: string) {
  return PUBLIC_WORD_BUILDERS.find((item) => item.slug === slug) ?? null;
}
