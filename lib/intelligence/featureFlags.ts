export const INTELLIGENCE_ENGINE_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE";
export const RECOMMENDATION_ENGINE_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS";
export const RECOMMENDATION_DEBUG_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATION_DEBUG";
export const SHOPIFY_COMMERCE_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_SHOPIFY_COMMERCE";
export const LEARNING_BASKET_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_LEARNING_BASKET";
export const COMMERCE_MAPPING_ADMIN_FLAG = "NEXT_PUBLIC_ENABLE_INTELLIGENCE_COMMERCE_MAPPING_ADMIN";

export function isIntelligenceEngineEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_ENGINE === "true";
}

export function isRecommendationEngineEnabled() {
  return isIntelligenceEngineEnabled() && process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATIONS === "true";
}

export function isRecommendationDebugEnabled() {
  return isRecommendationEngineEnabled() && process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_RECOMMENDATION_DEBUG === "true";
}

export function isShopifyCommerceEnabled() {
  return isRecommendationEngineEnabled() && process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_SHOPIFY_COMMERCE === "true";
}

export function isLearningBasketEnabled() {
  return isShopifyCommerceEnabled() && process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_LEARNING_BASKET === "true";
}

export function isCommerceMappingAdminEnabled() {
  return isShopifyCommerceEnabled() && process.env.NEXT_PUBLIC_ENABLE_INTELLIGENCE_COMMERCE_MAPPING_ADMIN === "true";
}
