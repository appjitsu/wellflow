export interface NormalizedProductionDto {
  organizationId: string;
  period: string; // YYYY-MM
  lines: Array<{
    wellId: string;
    apiNumber?: string;
    uwi?: string;
    product: 'OIL' | 'GAS' | 'WATER';
    volume: number;
    uom: 'BBL' | 'MCF' | 'BBL_WATER';
    dispositionCode?: string;
  }>;
}
