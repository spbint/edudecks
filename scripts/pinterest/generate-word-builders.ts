import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ENGLISH_WORKSHEET_RESOURCES } from "../../lib/clean/resources/englishWorksheetResources";

const DOWNLOADS = "C:\\Users\\seanb\\Downloads";
const OUTPUT = path.resolve("public/pinterest/word-builders");
const MANIFEST_PATH = path.join(OUTPUT, "manifest.json");
const CSV_PATH = path.resolve("scripts/pinterest/output/word-builders-pinterest.csv");
const SITE_URL = "https://www.mylearna.com";

type Candidate = { path: string; name: string; hash: string; size: number };
type GeneratedRow = { code: string; slug: string; title: string; stepKey: string; strand: string; stage: string; category: string; board: string; image: string; source: string; sourceHash: string; pdf: string; href: string; link: string; pinTitle: string; description: string };
type ManifestRow = Pick<GeneratedRow, "code" | "slug" | "title" | "stepKey" | "strand" | "stage" | "category" | "board" | "image" | "pinTitle" | "description" | "link" | "pdf" | "href">;

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }));
  return nested.flat();
}

function codeFromFilename(name: string) {
  const marker = name.toUpperCase().split("MYL-LIT-MORPH-")[1] ?? "";
  const parts = marker.split("-");
  return parts.length >= 2 && /^U\d{3}$/.test(parts[1]) ? `${parts[0]}-${parts[1]}` : null;
}

function slug(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function categoryFor(code: string) {
  if (/^(KF|EE)-/.test(code)) return { category: "PHONICS_CVC", board: "Homeschool Phonics & CVC Worksheets" };
  if (/^(E|UE|MS|HSF)-/.test(code)) return { category: "AFFIX_SPELLING", board: "Prefixes, Suffixes & Spelling Worksheets" };
  return { category: "ROOTS", board: "Greek & Latin Root Word Worksheets" };
}

function priority(name: string) {
  const upper = name.toUpperCase();
  return (upper.includes("REVISED") ? 40 : 0) + (upper.includes("A4") ? 20 : 0) + (upper.includes("(") ? 0 : 10);
}

async function main() {
  await fs.rm(OUTPUT, { recursive: true, force: true });
  await fs.mkdir(OUTPUT, { recursive: true });
  await fs.mkdir(path.dirname(CSV_PATH), { recursive: true });
  const files = (await walk(DOWNLOADS)).filter((file) => /MYL-LIT-MORPH-.*\.png$/i.test(path.basename(file)) && !/preview/i.test(file));
  const candidates = new Map<string, Candidate[]>();
  for (const file of files) {
    const name = path.basename(file);
    const code = codeFromFilename(name);
    if (!code) continue;
    const buffer = await fs.readFile(file);
    const candidate = { path: file, name, hash: crypto.createHash("sha256").update(buffer).digest("hex"), size: buffer.length };
    candidates.set(code, [...(candidates.get(code) ?? []), candidate]);
  }

  const rows: GeneratedRow[] = [];
  for (const [code, variants] of [...candidates.entries()].sort()) {
    const resource = code === "E-U002"
      ? ENGLISH_WORKSHEET_RESOURCES.find((item) => item.stepKey === "u001-prefix-re")
      : ENGLISH_WORKSHEET_RESOURCES.find((item) => item.fileName.toUpperCase().includes(`-${code}-`));
    if (!resource) continue;
    const byHash = new Map<string, Candidate>();
    for (const variant of variants) if (!byHash.has(variant.hash) || priority(variant.name) > priority(byHash.get(variant.hash)!.name)) byHash.set(variant.hash, variant);
    const source = [...byHash.values()].sort((a, b) => priority(b.name) - priority(a.name) || a.name.localeCompare(b.name))[0];
    const unitSlug = `${code.toLowerCase()}-${slug(resource.title)}`;
    const outputName = `${unitSlug}.png`;
    const outputPath = path.join(OUTPUT, outputName);
    await sharp(source.path).resize(1000, 1500, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).png().toFile(outputPath);
    const category = categoryFor(code);
    const rootLabel = resource.title.replace(/^(Greek|Latin) Root[s]? /, "");
    const title = category.category === "PHONICS_CVC"
      ? `${resource.title} Worksheet | Homeschool Phonics`
      : category.category === "ROOTS"
        ? `${resource.title} Worksheet | Vocabulary & Morphology`
        : `${resource.title} Worksheet | Homeschool Word Study`;
    const description = category.category === "PHONICS_CVC"
      ? `Support homeschool phonics with the MyLearna ${resource.title.toLowerCase()} worksheet. A practical Word Builders resource for sound, spelling and early reading practice.`
      : category.category === "ROOTS"
        ? `Help learners explore ${rootLabel.toLowerCase()} and connect meaningful word parts with vocabulary. This MyLearna Word Builders worksheet supports homeschool morphology and word study.`
        : `Explore ${resource.title.toLowerCase()} with this printable MyLearna Word Builders worksheet. A homeschool-friendly resource for spelling, morphology and vocabulary practice.`;
    const link = `${SITE_URL}/word-builders/${unitSlug}?utm_source=pinterest&utm_medium=organic&utm_campaign=word_builders&utm_content=${code.toLowerCase()}`;
    rows.push({ code, slug: unitSlug, title: resource.title, stepKey: resource.stepKey, strand: resource.strandKey, stage: resource.stageKey, category: category.category, board: category.board, image: `/pinterest/word-builders/${outputName}`, source: source.name, sourceHash: source.hash, pdf: resource.fileName, href: resource.href, link, pinTitle: title.slice(0, 100), description: description.slice(0, 499) });
  }

  const manifest: ManifestRow[] = rows.map(({ code, slug, title, stepKey, strand, stage, category, board, image, pinTitle, description, link, pdf, href }) => ({ code, slug, title, stepKey, strand, stage, category, board, image, pinTitle, description, link, pdf, href }));
  const categoryOrder = ["PHONICS_CVC", "ROOTS", "AFFIX_SPELLING"];
  const categoryQueues = new Map(categoryOrder.map((category) => [category, manifest.filter((item) => item.category === category)]));
  const scheduledManifest: ManifestRow[] = [];
  while (scheduledManifest.length < manifest.length) {
    for (const category of categoryOrder) {
      const queue = categoryQueues.get(category) ?? [];
      const next = queue.shift();
      if (next) scheduledManifest.push(next);
    }
  }
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const header = ["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"];
  const scheduleStart = new Date();
  scheduleStart.setUTCDate(scheduleStart.getUTCDate() + 1);
  scheduleStart.setUTCHours(0, 30, 0, 0);
  const scheduleSlots = [0, 3.5, 7.5, 11.5, 15.5];
  const csvRows = scheduledManifest.map((row, index) => {
    const publishDate = new Date(scheduleStart.getTime() + (Math.floor(index / 5) * 24 + scheduleSlots[index % 5]) * 60 * 60 * 1000).toISOString();
    const keywords = row.category === "PHONICS_CVC" ? "homeschool phonics worksheet, CVC words, early reading, short vowels, homeschool English, printable worksheet" : row.category === "ROOTS" ? "Greek roots, Latin roots, root words, morphology, vocabulary worksheet, homeschool English, word study" : "prefix worksheet, suffix worksheet, morphology, spelling, word study, homeschool English, vocabulary";
    return [row.pinTitle, `${SITE_URL}${row.image}`, row.board, "", row.description, row.link, publishDate, keywords].map(csvCell).join(",");
  });
  await fs.writeFile(CSV_PATH, `${header.map(csvCell).join(",")}\n${csvRows.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ rows: manifest.length, output: OUTPUT, csv: CSV_PATH }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
