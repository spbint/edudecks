const RESOURCE_SYNONYMS: Record<string, string> = {
  sheets: "paper",
  sheet: "paper",
  papers: "paper",
  pencils: "pencil",
  pens: "pen",
  markers: "marker",
  crayons: "crayon",
  containers: "container",
  cups: "cup",
  cartons: "carton",
  boxes: "box",
  jars: "jar",
  bottles: "bottle",
  rulers: "ruler",
  books: "book",
};

export function normaliseResourceKey(value: unknown) {
  const words = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => RESOURCE_SYNONYMS[word] ?? word);
  return words.join(" ");
}

export const HOUSEHOLD_RESOURCE_KEYS = new Set([
  "paper", "pencil", "pen", "marker", "crayon", "water", "cup", "container", "box", "carton", "jar", "bottle", "ruler", "book", "scissors", "tape", "string",
]);

export function isBlockedResource(value: string) {
  return /\b(weapon|firearm|explosive|bleach|solvent|poison|illegal)\b/i.test(value);
}
