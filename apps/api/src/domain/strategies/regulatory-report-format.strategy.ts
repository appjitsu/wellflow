import { RegulatoryReport } from '../entities/regulatory-report.entity';

/**
 * Report format options
 */
export interface ReportFormatOptions {
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  includeMetadata?: boolean;
  includeValidation?: boolean;
  compressAttachments?: boolean;
}

/**
 * Formatted report result
 */
export interface FormattedReportResult {
  content: Buffer;
  contentType: string;
  filename: string;
  metadata?: Record<string, unknown>;
}

/**
 * Regulatory Report Format Strategy Interface
 * Defines the contract for formatting regulatory reports in different formats
 */
export interface RegulatoryReportFormatStrategy {
  /**
   * Format type this strategy handles
   */
  getFormatType(): string;

  /**
   * Check if this strategy can handle the given format
   */
  canHandle(format: string): boolean;

  /**
   * Format the regulatory report
   */
  formatReport(
    report: RegulatoryReport,
    data: Record<string, unknown>,
    options?: ReportFormatOptions,
  ): Promise<FormattedReportResult>;

  /**
   * Get supported content types
   */
  getSupportedContentTypes(): string[];

  /**
   * Validate format-specific requirements
   */
  validateFormatRequirements(
    report: RegulatoryReport,
    data: Record<string, unknown>,
  ): Promise<{ isValid: boolean; errors?: string[] }>;
}

/**
 * JSON Regulatory Report Format Strategy
 * Formats reports as structured JSON for API submissions
 */
export class JSONRegulatoryReportFormatStrategy
  implements RegulatoryReportFormatStrategy
{
  getFormatType(): string {
    return 'json';
  }

  canHandle(format: string): boolean {
    return format === 'json' || format === 'application/json';
  }

  formatReport(
    report: RegulatoryReport,
    data: Record<string, unknown>,
    options: ReportFormatOptions = {},
  ): Promise<FormattedReportResult> {
    const formattedData = {
      report: {
        id: report.id,
        type: report.reportType.value,
        regulatoryAgency: report.regulatoryAgency,
        reportingPeriod: {
          start: report.reportingPeriodStart?.toISOString(),
          end: report.reportingPeriodEnd?.toISOString(),
        },
        dueDate: report.dueDate?.toISOString(),
        status: report.status.value,
        validationStatus: report.validationStatus,
        complianceStatus: report.complianceStatus,
      },
      data,
      metadata: options.includeMetadata
        ? {
            generatedAt: new Date().toISOString(),
            formatVersion: '1.0',
            generator: 'WellFlow Regulatory System',
            organizationId: report.organizationId,
          }
        : undefined,
      validation: options.includeValidation
        ? {
            status: report.validationStatus,
            errors: report.validationErrors,
            complianceStatus: report.complianceStatus,
            lastValidated: report.updatedAt?.toISOString(),
          }
        : undefined,
    };

    const content = Buffer.from(JSON.stringify(formattedData, null, 2));

    return Promise.resolve({
      content,
      contentType: 'application/json',
      filename: `${report.regulatoryAgency}_${report.reportType.value}_${report.id}.json`,
      metadata: {
        format: 'json',
        size: content.length,
        compression: 'none',
      },
    });
  }

  getSupportedContentTypes(): string[] {
    return ['application/json'];
  }

  validateFormatRequirements(
    report: RegulatoryReport,
    data: Record<string, unknown>,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // JSON format has minimal requirements - just ensure data is serializable
    try {
      JSON.stringify(data);
    } catch {
      errors.push('Report data is not JSON serializable');
    }

    if (!report.reportType) {
      errors.push('Report type is required for JSON format');
    }

    return Promise.resolve({
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
}

/**
 * XML Regulatory Report Format Strategy
 * Formats reports as XML for structured data exchange
 */
export class XMLRegulatoryReportFormatStrategy
  implements RegulatoryReportFormatStrategy
{
  getFormatType(): string {
    return 'xml';
  }

  canHandle(format: string): boolean {
    return (
      format === 'xml' || format === 'application/xml' || format === 'text/xml'
    );
  }

  formatReport(
    report: RegulatoryReport,
    data: Record<string, unknown>,
    options: ReportFormatOptions = {},
  ): Promise<FormattedReportResult> {
    const xmlContent = this.convertToXml({
      RegulatoryReport: {
        ReportHeader: {
          ReportId: report.id,
          ReportType: report.reportType.value,
          RegulatoryAgency: report.regulatoryAgency,
          OrganizationId: report.organizationId,
          ReportingPeriodStart: report.reportingPeriodStart?.toISOString(),
          ReportingPeriodEnd: report.reportingPeriodEnd?.toISOString(),
          DueDate: report.dueDate?.toISOString(),
          Status: report.status.value,
          ValidationStatus: report.validationStatus,
          ComplianceStatus: report.complianceStatus,
          GeneratedAt: new Date().toISOString(),
        },
        ReportData: data,
        Metadata: options.includeMetadata
          ? {
              FormatVersion: '1.0',
              Generator: 'WellFlow Regulatory System',
              Compression: 'none',
              IncludeHeaders: options.includeHeaders || false,
            }
          : undefined,
      },
    });

    const content = Buffer.from(xmlContent);

    return Promise.resolve({
      content,
      contentType: 'application/xml',
      filename: `${report.regulatoryAgency}_${report.reportType.value}_${report.id}.xml`,
      metadata: {
        format: 'xml',
        size: content.length,
        compression: 'none',
        encoding: 'UTF-8',
      },
    });
  }

  getSupportedContentTypes(): string[] {
    return ['application/xml', 'text/xml'];
  }

  validateFormatRequirements(
    report: RegulatoryReport,
    data: Record<string, unknown>,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // XML format requires valid element names and structure
    if (!report.regulatoryAgency) {
      errors.push('Regulatory agency is required for XML format');
    }

    if (!report.reportType) {
      errors.push('Report type is required for XML format');
    }

    // Check for XML-invalid characters in data
    const dataString = JSON.stringify(data);
    if (dataString.includes('<') && !dataString.includes('>')) {
      errors.push('Report data contains unbalanced XML characters');
    }

    return Promise.resolve({
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  private convertToXml(
    obj: Record<string, unknown>,
    rootName?: string,
  ): string {
    let xml = '';

    if (rootName) {
      xml += `<${rootName}>`;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      const elementName = key.replace(/\W/g, '_');

      if (typeof value === 'object' && !Array.isArray(value)) {
        xml += this.convertToXml(value as Record<string, unknown>, elementName);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'object') {
            xml += this.convertToXml(
              item as Record<string, unknown>,
              elementName,
            );
          } else {
            xml += `<${elementName}>${this.escapeXml(String(item))}</${elementName}>`;
          }
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        xml += `<${elementName}>${this.escapeXml(String(value))}</${elementName}>`;
      }
    }

    if (rootName) {
      xml += `</${rootName}>`;
    }

    return xml;
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&#39;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }
}

/**
 * CSV Regulatory Report Format Strategy
 * Formats reports as CSV for spreadsheet compatibility
 */
export class CSVRegulatoryReportFormatStrategy
  implements RegulatoryReportFormatStrategy
{
  getFormatType(): string {
    return 'csv';
  }

  canHandle(format: string): boolean {
    return format === 'csv' || format === 'text/csv';
  }

  formatReport(
    report: RegulatoryReport,
    data: Record<string, unknown>,
    options: ReportFormatOptions = {},
  ): Promise<FormattedReportResult> {
    const rows: string[][] = [];

    // Add headers if requested
    if (options.includeHeaders !== false) {
      const headers = this.extractHeaders(data);
      rows.push(headers);
    }

    // Add metadata row if requested
    if (options.includeMetadata) {
      rows.push([
        'Report ID',
        'Type',
        'Agency',
        'Period Start',
        'Period End',
        'Status',
        'Generated At',
      ]);
      rows.push([
        report.id,
        report.reportType.value,
        report.regulatoryAgency,
        report.reportingPeriodStart?.toISOString() || '',
        report.reportingPeriodEnd?.toISOString() || '',
        report.status.value,
        new Date().toISOString(),
      ]);
      rows.push([]); // Empty row separator
    }

    // Convert data to CSV rows
    const dataRows = this.convertDataToRows(data);
    rows.push(...dataRows);

    const csvContent = rows
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    const content = Buffer.from(csvContent);

    return Promise.resolve({
      content,
      contentType: 'text/csv',
      filename: `${report.regulatoryAgency}_${report.reportType.value}_${report.id}.csv`,
      metadata: {
        format: 'csv',
        size: content.length,
        compression: 'none',
        rowCount: rows.length,
        columnCount: rows[0]?.length || 0,
      },
    });
  }

  getSupportedContentTypes(): string[] {
    return ['text/csv', 'application/csv'];
  }

  validateFormatRequirements(
    report: RegulatoryReport,
    data: Record<string, unknown>,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // CSV format works with most data, but check for basic structure
    if (typeof data !== 'object') {
      errors.push('CSV format requires object data structure');
    }

    return Promise.resolve({
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  private extractHeaders(data: Record<string, unknown>): string[] {
    const headers = new Set<string>();

    const extractFromObject = (obj: Record<string, unknown>, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          extractFromObject(value as Record<string, unknown>, fullKey);
        } else {
          headers.add(fullKey);
        }
      }
    };

    extractFromObject(data);
    return Array.from(headers);
  }

  private convertDataToRows(data: Record<string, unknown>): string[][] {
    const rows: string[][] = [];
    const headers = this.extractHeaders(data);

    const flattenObject = (
      obj: Record<string, unknown>,
      prefix = '',
    ): Record<string, string> => {
      const result: Record<string, string> = {};

      /* eslint-disable security/detect-object-injection */
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          Object.assign(
            result,
            flattenObject(value as Record<string, unknown>, fullKey),
          );
        } else {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          result[fullKey] = String(value ?? '');
        }
      }
      /* eslint-enable security/detect-object-injection */

      return result;
    };

    const flattened = flattenObject(data);
    /* eslint-disable security/detect-object-injection */
    rows.push(headers.map((header) => flattened[header] || ''));
    /* eslint-enable security/detect-object-injection */

    return rows;
  }
}

/**
 * PDF Regulatory Report Format Strategy
 * Formats reports as PDF documents for formal submissions
 */
export class PDFRegulatoryReportFormatStrategy
  implements RegulatoryReportFormatStrategy
{
  getFormatType(): string {
    return 'pdf';
  }

  canHandle(format: string): boolean {
    return format === 'pdf' || format === 'application/pdf';
  }

  formatReport(
    report: RegulatoryReport,
    data: Record<string, unknown>,
    options: ReportFormatOptions = {},
  ): Promise<FormattedReportResult> {
    // Placeholder PDF generation - implement using pdfkit or puppeteer
    const pdfContent = this.generatePlaceholderPDF(report, data, options);
    const content = Buffer.from(pdfContent);

    return Promise.resolve({
      content,
      contentType: 'application/pdf',
      filename: `${report.regulatoryAgency}_${report.reportType.value}_${report.id}.pdf`,
      metadata: {
        format: 'pdf',
        size: content.length,
        compression: 'none',
        pageCount: 1,
        generator: 'WellFlow PDF Generator',
      },
    });
  }

  getSupportedContentTypes(): string[] {
    return ['application/pdf'];
  }

  validateFormatRequirements(
    report: RegulatoryReport,
    _data: Record<string, unknown>,
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // PDF format has minimal requirements
    if (!report.regulatoryAgency) {
      errors.push('Regulatory agency is required for PDF format');
    }

    if (!report.reportType) {
      errors.push('Report type is required for PDF format');
    }

    return Promise.resolve({
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  private generatePlaceholderPDF(
    report: RegulatoryReport,
    _data: Record<string, unknown>,
    _options: ReportFormatOptions,
  ): string {
    // This is a placeholder - in a real implementation, you'd use a PDF library
    // to generate actual PDF content
    return `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
50 750 Td
(${report.regulatoryAgency} - ${report.reportType.value}) Tj
0 -20 Td
(Report ID: ${report.id}) Tj
0 -20 Td
(Generated: ${new Date().toISOString()}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000418 00000 n
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
518
%%EOF
    `.trim();
  }
}
