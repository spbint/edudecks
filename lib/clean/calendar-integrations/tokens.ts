import { createHash, randomBytes } from "node:crypto";

export type CalendarFeedToken = {
  rawToken: string;
  tokenHash: string;
  tokenPrefix: string;
};

export function hashCalendarFeedToken(rawToken: string) {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function generateCalendarFeedToken(): CalendarFeedToken {
  const rawToken = randomBytes(32).toString("base64url");

  return {
    rawToken,
    tokenHash: hashCalendarFeedToken(rawToken),
    tokenPrefix: rawToken.slice(0, 8),
  };
}
