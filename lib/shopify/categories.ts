export const MARKETPLACE_CATEGORIES = [
  { handle: "educational-supplies", title: "Educational Supplies" },
  { handle: "maths-literacy", title: "Maths & Literacy" },
  { handle: "science-discovery", title: "Science & Discovery" },
  { handle: "art-design-technology", title: "Art, Design & Technology" },
  { handle: "learning-kits", title: "Learning Kits" },
  { handle: "homeschool-essentials", title: "Homeschool Essentials" },
  { handle: "mylearna-programs", title: "MyLearna Programs" },
  { handle: "faith-based-resources", title: "Faith-Based Resources" },
] as const;

export function configuredMarketplaceCategory(handle: string) {
  return MARKETPLACE_CATEGORIES.find((category) => category.handle === handle) ?? null;
}
