import type { LearningPlanRecommendationInput, LearningRecommendation, RecommendationResourceInput } from "@/lib/intelligence/recommendations/types";

export const COMMERCE_ENGINE_VERSION = "mylearna-commerce-engine-v1";
export const COMMERCE_RULES_VERSION = "mylearna-commerce-rules-v1";

export type CommerceFulfilmentType =
  | "mylearna_owned_stock"
  | "dropship_supplier"
  | "third_party_shopify_seller"
  | "future_affiliate_placeholder";

export type CommerceAvailability = "available" | "unavailable" | "region_ineligible";

export interface CommerceResourceRequirement {
  recommendationId: string;
  resource: RecommendationResourceInput;
  required: boolean;
  learnerAgeOrStage: string | null;
  subjects: string[];
  curriculumConcepts: string[];
  parentPreferences: string | null;
  sourceRecommendation: LearningRecommendation;
}

export interface CommerceProduct {
  provider: "shopify";
  providerProductId: string;
  providerVariantId: string;
  title: string;
  summary: string;
  productUrl: string;
  imageUrl: string | null;
  price: { amount: number; currency: string };
  availability: CommerceAvailability;
  stockStatus: "in_stock" | "out_of_stock" | "unknown";
  region: string;
  fulfilmentType: CommerceFulfilmentType;
  resourceKeys: string[];
  tags: string[];
  educationalCategory: string | null;
  priceBand: string | null;
  ageStages: string[];
  subjects: string[];
  lastSyncedAt: string;
  disclosure: string;
}

export interface CommerceProductCandidate {
  commerceRecommendationId: string;
  sourceRecommendationId: string;
  resourceKey: string;
  product: CommerceProduct;
  required: boolean;
  optional: boolean;
  matchConfidence: number;
  matchReasons: string[];
  priorityRank: number;
  reasonCode: "ESSENTIAL_COMMERCIAL" | "OPTIONAL_COMMERCIAL";
  parentReadableReason: string;
  engineVersion: string;
  rulesVersion: string;
  sourcePlan: { planId: string; revisionId: string; revisionNumber: number };
  provenance: { sourceProvenance: LearningPlanRecommendationInput["sourceProvenance"]; generatedAt: string };
}

export interface CommerceExclusion {
  providerProductId: string;
  resourceKey: string;
  reason: string;
}

export interface CommerceResult {
  provider: "shopify";
  status: "ready" | "disabled" | "unavailable";
  products: CommerceProductCandidate[];
  exclusions: CommerceExclusion[];
  unmatchedResourceKeys: string[];
  generatedAt: string;
  providerError?: string;
}

export interface CommerceProviderContext {
  region: string;
  now?: () => Date;
}

export interface CommerceProvider {
  readonly provider: "shopify";
  getProductsForResources(resources: CommerceResourceRequirement[], context: CommerceProviderContext): Promise<CommerceProduct[]>;
}

export interface CommerceResourceMapping {
  id: string;
  resourceKey: string;
  provider: "shopify";
  providerProductId: string;
  providerVariantId: string | null;
  status: "pending" | "approved" | "rejected";
  matchConfidence: number;
  preferred: boolean;
  paused: boolean;
  notes: string;
  createdByUserId: string | null;
  approvedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceMappingRepository {
  listForResourceKeys(resourceKeys: string[]): Promise<CommerceResourceMapping[]>;
  listAll(): Promise<CommerceResourceMapping[]>;
  upsertForAdmin(input: Omit<CommerceResourceMapping, "id" | "createdAt" | "updatedAt">): Promise<CommerceResourceMapping>;
}

export type BasketStatus = "active" | "submitted" | "abandoned";
export type BasketItemStatus = "active" | "removed";

export interface LearningBasket {
  id: string;
  userId: string;
  planId: string;
  revisionId: string;
  revisionNumber: number;
  status: BasketStatus;
  currency: string;
  items: LearningBasketItem[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningBasketItem {
  id: string;
  basketId: string;
  resourceKey: string;
  provider: "shopify";
  providerProductId: string;
  providerVariantId: string;
  title: string;
  quantity: number;
  priceSnapshot: { amount: number; currency: string };
  productUrl: string;
  fulfilmentType: CommerceFulfilmentType;
  status: BasketItemStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LearningBasketRepository {
  getForUser(userId: string, planId: string, revisionId: string): Promise<LearningBasket | null>;
  addItemForUser(userId: string, input: Omit<LearningBasketItem, "id" | "basketId" | "createdAt" | "updatedAt"> & { planId: string; revisionId: string; revisionNumber: number }): Promise<LearningBasket>;
  removeItemForUser(userId: string, basketId: string, itemId: string): Promise<LearningBasket>;
}

export type CommerceEventType =
  | "product_impression"
  | "product_opened"
  | "added_to_basket"
  | "removed_from_basket"
  | "outbound_shopify_click"
  | "resource_requested"
  | "product_recommended"
  | "product_clicked"
  | "product_added"
  | "resource_fulfilled"
  | "no_suitable_product_found";

export interface CommerceEvent {
  id: string;
  userId: string;
  planId: string;
  revisionId: string;
  revisionNumber: number;
  eventType: CommerceEventType;
  provider: "shopify";
  productId: string | null;
  resourceKey: string | null;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
}

export interface CommerceEventRepository {
  recordForUser(userId: string, input: Omit<CommerceEvent, "id" | "userId" | "createdAt">): Promise<CommerceEvent>;
}
