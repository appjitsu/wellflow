export type AmendmentType = 'ORIGINAL' | 'CORRECTED' | 'AMENDED';

export interface TxPrExportArtifact {
  period: string;
  bytesBase64: string;
  length: number;
  generatedAtUtc: string;
  amendmentType: AmendmentType;
}

export interface RegulatoryReportFormData {
  txPrExport?: TxPrExportArtifact;
  [key: string]: unknown;
}
