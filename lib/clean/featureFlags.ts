export const CLEAN_APP_FLAG = "NEXT_PUBLIC_USE_CLEAN_APP";

export function isCleanAppEnabled() {
  return process.env.NEXT_PUBLIC_USE_CLEAN_APP === "true";
}
