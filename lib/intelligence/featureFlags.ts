export const INTELLIGENCE_ENGINE_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE";

export function isIntelligenceEngineEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE === "true";
}
