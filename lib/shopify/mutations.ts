import { CART_FRAGMENT, IMAGE_FRAGMENT, MONEY_FRAGMENT } from "./fragments";

export const CREATE_CART_MUTATION = `#graphql
  mutation MarketplaceCreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...MarketplaceCart }
      userErrors { field message code }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`;

export const ADD_CART_LINES_MUTATION = `#graphql
  mutation MarketplaceAddCartLines($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...MarketplaceCart }
      userErrors { field message code }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`;

export const UPDATE_CART_LINES_MUTATION = `#graphql
  mutation MarketplaceUpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...MarketplaceCart }
      userErrors { field message code }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`;

export const REMOVE_CART_LINES_MUTATION = `#graphql
  mutation MarketplaceRemoveCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...MarketplaceCart }
      userErrors { field message code }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  ${CART_FRAGMENT}
`;

