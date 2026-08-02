export const IMAGE_FRAGMENT = `
  fragment MarketplaceImage on Image {
    url
    altText
    width
    height
  }
`;

export const MONEY_FRAGMENT = `
  fragment MarketplaceMoney on MoneyV2 {
    amount
    currencyCode
  }
`;

export const PRODUCT_SUMMARY_FRAGMENT = `
  fragment MarketplaceProductSummary on Product {
    id
    handle
    title
    vendor
    productType
    tags
    availableForSale
    featuredImage { ...MarketplaceImage }
    collections(first: 12) { nodes { id handle title image { ...MarketplaceImage } } }
    priceRange {
      minVariantPrice { ...MarketplaceMoney }
      maxVariantPrice { ...MarketplaceMoney }
    }
  }
`;

export const PRODUCT_FRAGMENT = `
  fragment MarketplaceProduct on Product {
    id
    handle
    title
    description
    descriptionHtml
    vendor
    productType
    tags
    featuredImage { ...MarketplaceImage }
    images(first: 20) { nodes { ...MarketplaceImage } }
    variants(first: 100) {
      nodes {
        id
        title
        availableForSale
        quantityAvailable
        selectedOptions { name value }
        price { ...MarketplaceMoney }
        compareAtPrice { ...MarketplaceMoney }
        image { ...MarketplaceImage }
      }
    }
    collections(first: 12) {
      nodes { id handle title image { ...MarketplaceImage } }
    }
    seo { title description }
  }
`;

export const CART_FRAGMENT = `
  fragment MarketplaceCart on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { ...MarketplaceMoney }
      totalAmount { ...MarketplaceMoney }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          totalAmount { ...MarketplaceMoney }
          amountPerQuantity { ...MarketplaceMoney }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            price { ...MarketplaceMoney }
            product {
              handle
              title
              featuredImage { ...MarketplaceImage }
              collections(first: 12) { nodes { id handle title image { ...MarketplaceImage } } }
            }
          }
        }
      }
    }
  }
`;
