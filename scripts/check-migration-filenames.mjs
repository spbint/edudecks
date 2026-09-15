import { readdirSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql"));
const pattern = /^(\d{14})_([a-z0-9][a-z0-9_-]*)\.sql$/;
const invalid = files.filter((file) => !pattern.test(file));
const parsed = files
  .map((file) => {
    const match = pattern.exec(file);
    return match ? { file, version: match[1] } : null;
  })
  .filter(Boolean);
const byVersion = new Map();

for (const migration of parsed) {
  const existing = byVersion.get(migration.version) ?? [];
  existing.push(migration.file);
  byVersion.set(migration.version, existing);
}

const duplicates = [...byVersion.entries()].filter(([, names]) => names.length > 1);

if (invalid.length > 0 || duplicates.length > 0) {
  if (invalid.length > 0) {
    console.error(`Malformed migration filename(s): ${invalid.join(", ")}`);
  }
  for (const [version, names] of duplicates) {
    console.error(`Duplicate migration version ${version}: ${names.join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Validated ${parsed.length} migration filenames; versions are unique and use valid timestamp prefixes.`);
}
