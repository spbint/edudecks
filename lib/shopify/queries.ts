import { CART_FRAGMENT, IMAGE_FRAGMENT, MONEY_FRAGMENT, PRODUCT_FRAGMENT, PRODUCT_SUMMARY_FRAGMENT } from "./fragments";

export const HOME_QUERY = `#graphql
  query MarketplaceHome($collectionFirst: Int!, $productFirst: Int!) {
    collections(first: $collectionFirst) {
      nodes { id handle title description image { ...MarketplaceImage } }
    }
    products(first: $productFirst, sortKey: CREATED_AT, reverse: true) { nodes { ...MarketplaceProductSummary } }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const COLLECTIONS_QUERY = `#graphql
  query MarketplaceCollections($first: Int!) {
    collections(first: $first) { nodes { id handle title description image { ...MarketplaceImage } } }
  }
  ${IMAGE_FRAGMENT}
`;

export const COLLECTION_QUERY = `#graphql
  query MarketplaceCollection($handle: String!, $first: Int!) {
    collectionByHandle(handle: $handle) {
      id handle title description image { ...MarketplaceImage }
      seo { title description }
      products(first: $first) { nodes { ...MarketplaceProductSummary } }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_SUMMARY_FRAGMENT}
`;

export const PRODUCT_QUERY = `#graphql
  query MarketplaceProduct($handle: String!) {
    product(handle: $handle) { ...MarketplaceProduct }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${PRODUCT_FRAGMENT}
`;

export const VARIANT_QUERY = `#graphql
  query MarketplaceVariant($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        availableForSale
        quantityAvailable
        product {
          collections(first: 12) { nodes { id handle title image { ...MarketplaceImage } } }
        }
      }
    }
  }
  ${IMAGE_FRAGMENT}
`;

export const CART_QUERY = `#graphql
  query MarketplaceCart($id: ID!) { cart(id: $id) { ...MarketplaceCart } }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`;
