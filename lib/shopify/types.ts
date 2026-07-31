export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ShopifyMoney = {
  amount: string;
  currencyCode: string;
};

export type ShopifySelectedOption = {
  name: string;
  value: string;
};

export type ShopifyProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: ShopifySelectedOption[];
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  image: ShopifyImage | null;
};

export type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage: ShopifyImage | null;
  images: ShopifyImage[];
  variants: ShopifyProductVariant[];
  vendor: string;
  productType: string;
  tags: string[];
  collections: ShopifyCollectionSummary[];
  seo: { title: string | null; description: string | null };
};

export type ShopifyProductSummary = Pick<ShopifyProduct, "id" | "handle" | "title" | "featuredImage" | "vendor" | "productType" | "tags"> & {
  priceRange: { minVariantPrice: ShopifyMoney; maxVariantPrice: ShopifyMoney };
  availableForSale: boolean;
};

export type ShopifyCollectionSummary = {
  id: string;
  handle: string;
  title: string;
  image: ShopifyImage | null;
};

export type ShopifyCollection = ShopifyCollectionSummary & {
  description: string;
  products: ShopifyProductSummary[];
  seo: { title: string | null; description: string | null };
};

export type ShopifyCartLine = {
  id: string;
  quantity: number;
  cost: { totalAmount: ShopifyMoney; amountPerQuantity: ShopifyMoney };
  merchandise: {
    id: string;
    title: string;
    product: { handle: string; title: string; featuredImage: ShopifyImage | null };
    price: ShopifyMoney;
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string | null;
  totalQuantity: number;
  cost: { subtotalAmount: ShopifyMoney; totalAmount: ShopifyMoney };
  lines: ShopifyCartLine[];
};

export type ShopifyUserError = { field: string[] | null; message: string; code: string | null };

