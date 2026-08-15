import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const SECRET_VERSION = "v1";

function requireEncryptionKey() {
  const encoded = String(
    process.env.CALENDAR_INTEGRATION_ENCRYPTION_KEY ?? "",
  ).trim();
  if (!/^[A-Za-z0-9+/_-]+={0,2}$/.test(encoded)) {
    throw new Error("Calendar integration encryption is not configured.");
  }
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const key = Buffer.from(normalized, "base64");
  if (key.length !== 32) {
    throw new Error("Calendar integration encryption is not configured.");
  }
  return key;
}

export function calendarEncryptionEnvironmentReady() {
  try {
    requireEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptCalendarSecret(plaintext: string) {
  if (!plaintext) throw new Error("Calendar secret cannot be empty.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", requireEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    SECRET_VERSION,
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

export function decryptCalendarSecret(value: string) {
  const [version, ivValue, ciphertextValue, tagValue, ...rest] = value.split(".");
  if (
    version !== SECRET_VERSION ||
    !ivValue ||
    !ciphertextValue ||
    !tagValue ||
    rest.length
  ) {
    throw new Error("Calendar secret is unreadable.");
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      requireEncryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Calendar secret is unreadable.");
  }
}

export function hashCalendarOAuthState(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
