import type { CurrencyTokenStimulus } from "@/lib/clean/assessments/mylearnaAssessTypes";
import {
  classifyStartingPointDevelopmentalAccessibility,
  getStartingPointPresentationCopy,
} from "./startingPointDevelopmentalAccessibility";
import {
  getStartingPointRendererQaItems,
  type StartingPointRendererQaItem,
} from "./startingPointRendererCoverage";

const HISTORICAL_QA_ITEM_IDS = {
  77: "myl-recheck-cnt-p07-b-v1",
  79: "myl-anchor-cnt-p07-b-v1",
  141: "myl-anchor-npv-p03-b-v1",
} as const;

export type HistoricalTrustedAssetQaNumber =
  keyof typeof HISTORICAL_QA_ITEM_IDS;

export type TrustedCurrencyVisualAuditEntry = StartingPointRendererQaItem & {
  source: "canonical-stimulus" | "presentation-stimulus";
  denominations: string[];
};

export function getHistoricalTrustedAssetQaReferences() {
  const items = getStartingPointRendererQaItems();
  return Object.entries(HISTORICAL_QA_ITEM_IDS).map(
    ([qaNumberText, expectedItemId]) => {
      const qaNumber = Number(qaNumberText) as HistoricalTrustedAssetQaNumber;
      const entry = items[qaNumber - 1];
      if (!entry || entry.item.id !== expectedItemId) {
        throw new Error(
          `Historical QA ${qaNumber} no longer resolves to ${expectedItemId}.`,
        );
      }
      return { qaNumber, itemId: expectedItemId, ...entry };
    },
  );
}

export function getTrustedMathAssetCoverage() {
  const items = getStartingPointRendererQaItems();
  const baseTenVisuals = items.filter(
    (entry) => entry.item.stimulus.type === "place-value-blocks",
  );
  const currencyVisuals = items.flatMap<TrustedCurrencyVisualAuditEntry>(
    (entry) => {
      if (entry.item.stimulus.type === "currency-tokens") {
        const stimulus = entry.item.stimulus.data as CurrencyTokenStimulus;
        return [
          {
            ...entry,
            source: "canonical-stimulus",
            denominations: stimulus.tokens.map((token) => token.denomination),
          },
        ];
      }

      const presentation =
        classifyStartingPointDevelopmentalAccessibility(entry.item)
          .presentationStimulus;
      return presentation?.type === "currency-repeat"
        ? [
            {
              ...entry,
              source: "presentation-stimulus",
              denominations: Array.from(
                { length: presentation.count },
                () => presentation.denomination,
              ),
            },
          ]
        : [];
    },
  );
  const understandingMoneyItems = items
    .filter((entry) => entry.coverage.continuum === "understanding-money")
    .map((entry) => ({
      ...entry,
      learnerPrompt: getStartingPointPresentationCopy(entry.item).prompt,
    }));

  return {
    activeItems: items,
    historicalQa: getHistoricalTrustedAssetQaReferences(),
    baseTenVisuals,
    currencyVisuals,
    understandingMoneyItems,
  };
}
