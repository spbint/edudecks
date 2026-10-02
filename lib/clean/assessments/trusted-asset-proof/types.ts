export type AssetFormat = 'svg' | 'png';
export type Mode = 'assess' | 'practise';
export type AssetState = 'loading' | 'ready' | 'error';
export type ProofItem = {
  readonly id: string; readonly version: number; readonly kind: string;
  readonly title: string; readonly question: string; readonly alt: string;
  readonly options: readonly {readonly id: string; readonly label: string}[];
  readonly correctOptionId: string; readonly hint: string; readonly explanation: string;
  readonly reviewStatus: 'technical-candidate'; readonly checks: Record<string, unknown>;
  readonly asset: {
    readonly id: string; readonly version: number; readonly width: number; readonly height: number;
    readonly svgPath: string; readonly pngPath: string;
    readonly svgSha256: string; readonly pngSha256: string;
    readonly svgBytes: number; readonly pngBytes: number;
    readonly svgHref: string; readonly pngHref: string;
  };
};
export type ResponseRecord = {
  itemId: string; itemVersion: number; assetId: string; assetVersion: number;
  assetSha256: string; format: AssetFormat; mode: Mode;
  status: 'answered' | 'not_known'; selectedOptionId: string | null; correct: boolean | null;
  hintUsed: boolean; descriptionOpened: boolean;
};
export type TechnicalEvent = {itemId: string; type: 'load_error' | 'wrong_dimensions' | 'timeout' | 'simulated_failure' | 'integrity_mismatch' | 'wrong_mime' | 'access_denied'; format: AssetFormat};
