export const INTELLIGENCE_ENGINE_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE";
export const RECOMMENDATION_ENGINE_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS";
export const RECOMMENDATION_DEBUG_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATION_DEBUG";

export function isIntelligenceEngineEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE === "true";
}

export function isRecommendationEngineEnabled() {
  return isIntelligenceEngineEnabled() && process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS === "true";
}

export function isRecommendationDebugEnabled() {
  return isRecommendationEngineEnabled() && process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATION_DEBUG === "true";
}
