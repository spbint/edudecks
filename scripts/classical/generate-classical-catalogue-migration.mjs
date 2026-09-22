import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { getClassicalEncounterByCurriculumCode } from "../../lib/clean/curriculum/classicalCurriculumRegistry.ts";
import { generateClassicalCatalogueUpsertSql } from "../../lib/marketplace/classicalCatalogueProjection.ts";

function option(args, name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? "" : "";
}

function usage() {
  return "Usage: npm run classical:catalogue:sql -- --code <curriculum-code> [--out <path>]";
}

const args = process.argv.slice(2);
const curriculumCode = option(args, "--code");
const outputPath = option(args, "--out");

if (args.includes("--help")) {
  console.error(usage());
} else if (!curriculumCode) {
  console.error(usage());
  process.exitCode = 1;
} else if (args.includes("--out") && !outputPath) {
  console.error("--out requires an explicit file path.");
  process.exitCode = 1;
} else {
  const encounter = getClassicalEncounterByCurriculumCode(curriculumCode);
  if (!encounter) {
    console.error(`Unknown Classical curriculum code: ${curriculumCode}`);
    process.exitCode = 1;
  } else {
    const sql = generateClassicalCatalogueUpsertSql(encounter);
    console.error(
      `Classical catalogue projection: ${encounter.curriculumCode} (${encounter.releaseState})`,
    );
    if (outputPath) {
      const target = resolve(outputPath);
      writeFileSync(target, sql, "utf8");
      console.error(`Wrote deterministic SQL to ${target}`);
    } else {
      process.stdout.write(sql);
    }
  }
}
