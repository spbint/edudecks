const MAX_IDEA_TITLE_LENGTH = 160;
const MAX_IDEA_DESCRIPTION_LENGTH = 10_000;
const MAX_SOURCE_URL_LENGTH = 2_048;

export type ValidationResult =
  | { valid: true }
  | { valid: false; message: string };

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateIdeaInput(input: {
  title?: unknown;
  description?: unknown;
}): ValidationResult {
  const title = text(input.title);
  const description = text(input.description);

  if (!title) return { valid: false, message: "An idea title is required." };
  if (title.length > MAX_IDEA_TITLE_LENGTH) {
    return { valid: false, message: "The idea title is too long." };
  }
  if (description.length > MAX_IDEA_DESCRIPTION_LENGTH) {
    return { valid: false, message: "The idea description is too long." };
  }

  return { valid: true };
}

export function validateSourceUrl(value: unknown): ValidationResult {
  const rawUrl = text(value);
  if (!rawUrl) return { valid: false, message: "A source URL is required." };
  if (rawUrl.length > MAX_SOURCE_URL_LENGTH) {
    return { valid: false, message: "The source URL is too long." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, message: "Enter a valid source URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, message: "Only HTTP and HTTPS source URLs are supported." };
  }
  if (parsed.username || parsed.password) {
    return { valid: false, message: "Source URLs cannot contain credentials." };
  }
  if (!parsed.hostname) {
    return { valid: false, message: "The source URL must include a hostname." };
  }

  return { valid: true };
}

export function validatePlanTitle(value: unknown): ValidationResult {
  const title = text(value);
  if (!title) return { valid: false, message: "A plan title is required." };
  if (title.length > MAX_IDEA_TITLE_LENGTH) {
    return { valid: false, message: "The plan title is too long." };
  }
  return { valid: true };
}
