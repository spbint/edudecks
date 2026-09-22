import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);

function transpileCanonicalModule(sourceUrl, outputPath) {
  const source = readFileSync(fileURLToPath(sourceUrl), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: fileURLToPath(sourceUrl),
    reportDiagnostics: true,
  });
  const errors = result.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (errors?.length) {
    throw new Error(
      `Unable to transpile canonical Classical module: ${errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
        .join("\n")}`,
    );
  }
  writeFileSync(outputPath, result.outputText, "utf8");
}

function loadCanonicalCatalogueModules(tempRoot) {
  const registryOutput = join(tempRoot, "classicalCurriculumRegistry.cjs");
  const projectionOutput = join(tempRoot, "classicalCatalogueProjection.cjs");
  transpileCanonicalModule(
    new URL("../../lib/clean/curriculum/classicalCurriculumRegistry.ts", import.meta.url),
    registryOutput,
  );
  transpileCanonicalModule(
    new URL("../../lib/marketplace/classicalCatalogueProjection.ts", import.meta.url),
    projectionOutput,
  );
  return {
    ...require(registryOutput),
    ...require(projectionOutput),
  };
}

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
  const tempRoot = mkdtempSync(join(tmpdir(), "mylearna-classical-catalogue-"));
  try {
    const {
      generateClassicalCatalogueUpsertSql,
      getClassicalEncounterByCurriculumCode,
    } = loadCanonicalCatalogueModules(tempRoot);
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
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}
