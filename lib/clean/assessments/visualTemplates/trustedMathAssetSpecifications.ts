export const BASE_TEN_MANIPULATIVE_SPEC = Object.freeze({
  unitEdge: 18,
  tenUnits: 10,
  hundredRows: 10,
  hundredColumns: 10,
  thousandRows: 10,
  thousandColumns: 10,
  palette: Object.freeze({
    face: "#A7D8F0",
    light: "#DDF3FC",
    side: "#72B7DB",
    edge: "#17658A",
    grid: "#438FAF",
    shadow: "#0F3F57",
  }),
});

export const AUSTRALIAN_COIN_DENOMINATIONS = [
  "5c",
  "10c",
  "20c",
  "50c",
  "$1",
  "$2",
] as const;

export type AustralianCoinDenomination =
  (typeof AUSTRALIAN_COIN_DENOMINATIONS)[number];

export type AustralianCoinSpecification = {
  denomination: AustralianCoinDenomination;
  diameterMm: number;
  sides: number | "circle";
  alloy: "silver" | "gold";
  classroomMotif:
    | "echidna"
    | "lyrebird"
    | "platypus"
    | "coat-of-arms"
    | "kangaroos"
    | "elder-and-stars";
};

export const AUSTRALIAN_COIN_SPECIFICATIONS: Readonly<
  Record<AustralianCoinDenomination, AustralianCoinSpecification>
> = Object.freeze({
  "5c": Object.freeze({
    denomination: "5c",
    diameterMm: 19.41,
    sides: "circle",
    alloy: "silver",
    classroomMotif: "echidna",
  }),
  "10c": Object.freeze({
    denomination: "10c",
    diameterMm: 23.6,
    sides: "circle",
    alloy: "silver",
    classroomMotif: "lyrebird",
  }),
  "20c": Object.freeze({
    denomination: "20c",
    diameterMm: 28.65,
    sides: "circle",
    alloy: "silver",
    classroomMotif: "platypus",
  }),
  "50c": Object.freeze({
    denomination: "50c",
    diameterMm: 31.65,
    sides: 12,
    alloy: "silver",
    classroomMotif: "coat-of-arms",
  }),
  "$1": Object.freeze({
    denomination: "$1",
    diameterMm: 25,
    sides: "circle",
    alloy: "gold",
    classroomMotif: "kangaroos",
  }),
  "$2": Object.freeze({
    denomination: "$2",
    diameterMm: 20.5,
    sides: "circle",
    alloy: "gold",
    classroomMotif: "elder-and-stars",
  }),
});

export const MAX_AUSTRALIAN_COIN_DIAMETER_MM =
  AUSTRALIAN_COIN_SPECIFICATIONS["50c"].diameterMm;

export function isAustralianCoinDenomination(
  denomination: string,
): denomination is AustralianCoinDenomination {
  return Object.hasOwn(AUSTRALIAN_COIN_SPECIFICATIONS, denomination);
}

export function getAustralianCoinRenderedDiameter(
  denomination: AustralianCoinDenomination,
  maximumDiameterPx: number,
) {
  return Math.round(
    (AUSTRALIAN_COIN_SPECIFICATIONS[denomination].diameterMm /
      MAX_AUSTRALIAN_COIN_DIAMETER_MM) *
      maximumDiameterPx,
  );
}
