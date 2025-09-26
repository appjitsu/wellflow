import { Injectable, Logger } from '@nestjs/common';
import {
  RegulatorySubmissionStrategy,
  SubmissionRequest,
  SubmissionResult,
  EPARegulatorySubmissionStrategy,
  OSHARegulatorySubmissionStrategy,
  StateRegulatorySubmissionStrategy,
} from './regulatory-submission.strategy';
import {
  RegulatoryReportFormatStrategy,
  ReportFormatOptions,
  FormattedReportResult,
  JSONRegulatoryReportFormatStrategy,
  XMLRegulatoryReportFormatStrategy,
  CSVRegulatoryReportFormatStrategy,
  PDFRegulatoryReportFormatStrategy,
} from './regulatory-report-format.strategy';
import { RegulatoryReport } from '../entities/regulatory-report.entity';

/**
 * Strategy selection criteria
 */
export interface StrategyCriteria {
  agencyCode?: string;
  reportType?: string;
  format?: string;
  stateCode?: string;
  organizationId?: string;
}

/**
 * Strategy capabilities
 */
export interface StrategyCapabilities {
  submissionStrategies: RegulatorySubmissionStrategy[];
  formatStrategies: RegulatoryReportFormatStrategy[];
}

/**
 * Strategy execution result
 */
export interface StrategyExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  strategyUsed?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Regulatory Strategy Manager Service
 * Orchestrates all regulatory strategies and provides unified interface
 * for regulatory operations across different agencies and formats
 */
@Injectable()
export class RegulatoryStrategyManagerService {
  private readonly logger = new Logger(RegulatoryStrategyManagerService.name);

  // Strategy collections
  private submissionStrategies: RegulatorySubmissionStrategy[] = [];
  private formatStrategies: RegulatoryReportFormatStrategy[] = [];

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize all available strategies
   */
  private initializeStrategies(): void {
    // Submission strategies
    this.submissionStrategies = [
      new EPARegulatorySubmissionStrategy(),
      new OSHARegulatorySubmissionStrategy(),
      // Add state strategies for major oil-producing states
      new StateRegulatorySubmissionStrategy('TX'), // Texas
      new StateRegulatorySubmissionStrategy('NM'), // New Mexico
      new StateRegulatorySubmissionStrategy('OK'), // Oklahoma
      new StateRegulatorySubmissionStrategy('CO'), // Colorado
      new StateRegulatorySubmissionStrategy('WY'), // Wyoming
      new StateRegulatorySubmissionStrategy('ND'), // North Dakota
    ];

    // Format strategies
    this.formatStrategies = [
      new JSONRegulatoryReportFormatStrategy(),
      new XMLRegulatoryReportFormatStrategy(),
      new CSVRegulatoryReportFormatStrategy(),
      new PDFRegulatoryReportFormatStrategy(),
    ];

    this.logger.log(
      `Initialized ${this.submissionStrategies.length} submission strategies and ${this.formatStrategies.length} format strategies`,
    );
  }

  /**
   * Submit a regulatory report using the appropriate strategy
   */
  async submitRegulatoryReport(
    request: SubmissionRequest,
    criteria: StrategyCriteria = {},
  ): Promise<StrategyExecutionResult<SubmissionResult>> {
    try {
      const strategy = this.selectSubmissionStrategy(
        request.agencyCode,
        criteria,
      );

      if (!strategy) {
        return {
          success: false,
          error: `No submission strategy found for agency: ${request.agencyCode}`,
        };
      }

      this.logger.log(
        `Submitting regulatory report using ${strategy.getAgencyCode()} strategy`,
      );

      // Validate submission requirements
      const validation = await strategy.validateSubmission(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // Execute submission
      const result = await strategy.submit(request);

      return {
        success: result.success,
        data: result,
        strategyUsed: strategy.getAgencyCode(),
        metadata: {
          agency: strategy.getAgencyCode(),
          validationPassed: true,
          supportedFormats: strategy.getSupportedFormats(),
        },
      };
    } catch (error) {
      this.logger.error('Error submitting regulatory report:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown submission error',
      };
    }
  }

  /**
   * Format a regulatory report using the appropriate strategy
   */
  async formatRegulatoryReport(
    report: RegulatoryReport,
    data: Record<string, unknown>,
    format: string,
    options: ReportFormatOptions = {},
    criteria: StrategyCriteria = {},
  ): Promise<StrategyExecutionResult<FormattedReportResult>> {
    try {
      const strategy = this.selectFormatStrategy(format, criteria);

      if (!strategy) {
        return {
          success: false,
          error: `No format strategy found for format: ${format}`,
        };
      }

      this.logger.log(
        `Formatting regulatory report using ${strategy.getFormatType()} strategy`,
      );

      // Validate format requirements
      const validation = await strategy.validateFormatRequirements(
        report,
        data,
      );
      if (!validation.isValid) {
        return {
          success: false,
          error: `Format validation failed: ${validation.errors?.join(', ')}`,
        };
      }

      // Execute formatting
      const result = await strategy.formatReport(report, data, options);

      return {
        success: true,
        data: result,
        strategyUsed: strategy.getFormatType(),
        metadata: {
          format: strategy.getFormatType(),
          contentType: result.contentType,
          filename: result.filename,
          size: result.content.byteLength,
        },
      };
    } catch (error) {
      this.logger.error('Error formatting regulatory report:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown formatting error',
      };
    }
  }

  /**
   * Check submission status using the appropriate strategy
   */
  async checkSubmissionStatus(
    agencyCode: string,
    externalId: string,
    criteria: StrategyCriteria = {},
  ): Promise<
    StrategyExecutionResult<{
      status: 'pending' | 'accepted' | 'rejected' | 'error';
      details?: Record<string, unknown>;
    }>
  > {
    try {
      const strategy = this.selectSubmissionStrategy(agencyCode, criteria);

      if (!strategy) {
        return {
          success: false,
          error: `No submission strategy found for agency: ${agencyCode}`,
        };
      }

      const status = await strategy.checkStatus(externalId);

      return {
        success: true,
        data: status,
        strategyUsed: strategy.getAgencyCode(),
        metadata: {
          externalId,
          agency: strategy.getAgencyCode(),
        },
      };
    } catch (error) {
      this.logger.error('Error checking submission status:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown status check error',
      };
    }
  }

  /**
   * Get capabilities for a given criteria
   */
  getCapabilities(criteria: StrategyCriteria = {}): StrategyCapabilities {
    let submissionStrategies = this.submissionStrategies;
    let formatStrategies = this.formatStrategies;

    // Filter strategies based on criteria
    if (criteria.agencyCode) {
      const agencyCode = criteria.agencyCode;
      submissionStrategies = submissionStrategies.filter((s) =>
        s.canHandle(agencyCode),
      );
    }

    if (criteria.format) {
      const format = criteria.format;
      formatStrategies = formatStrategies.filter((s) => s.canHandle(format));
    }

    return {
      submissionStrategies,
      formatStrategies,
    };
  }

  /**
   * Get available agency codes
   */
  getAvailableAgencies(): string[] {
    return this.submissionStrategies.map((s) => s.getAgencyCode());
  }

  /**
   * Get available format types
   */
  getAvailableFormats(): string[] {
    return this.formatStrategies.map((s) => s.getFormatType());
  }

  /**
   * Get required fields for a specific agency
   */
  getRequiredFields(
    agencyCode: string,
    criteria: StrategyCriteria = {},
  ): string[] {
    const strategy = this.selectSubmissionStrategy(agencyCode, criteria);
    return strategy?.getRequiredFields() || [];
  }

  /**
   * Get supported formats for a specific agency
   */
  getSupportedFormats(
    agencyCode: string,
    criteria: StrategyCriteria = {},
  ): string[] {
    const strategy = this.selectSubmissionStrategy(agencyCode, criteria);
    return strategy?.getSupportedFormats() || [];
  }

  /**
   * Validate submission data for a specific agency
   */
  async validateSubmissionData(
    agencyCode: string,
    report: RegulatoryReport,
    submissionData: Record<string, unknown>,
    criteria: StrategyCriteria = {},
  ): Promise<{ isValid: boolean; errors?: string[]; strategyUsed?: string }> {
    const strategy = this.selectSubmissionStrategy(agencyCode, criteria);

    if (!strategy) {
      return {
        isValid: false,
        errors: [`No submission strategy found for agency: ${agencyCode}`],
      };
    }

    const request: SubmissionRequest = {
      report,
      agencyCode,
      submissionData,
    };

    const validation = await strategy.validateSubmission(request);

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      strategyUsed: strategy.getAgencyCode(),
    };
  }

  /**
   * Validate format requirements for a specific format
   */
  async validateFormatRequirements(
    format: string,
    report: RegulatoryReport,
    data: Record<string, unknown>,
    criteria: StrategyCriteria = {},
  ): Promise<{ isValid: boolean; errors?: string[]; strategyUsed?: string }> {
    const strategy = this.selectFormatStrategy(format, criteria);

    if (!strategy) {
      return {
        isValid: false,
        errors: [`No format strategy found for format: ${format}`],
      };
    }

    const validation = await strategy.validateFormatRequirements(report, data);

    return {
      isValid: validation.isValid,
      errors: validation.errors,
      strategyUsed: strategy.getFormatType(),
    };
  }

  // Private helper methods

  private selectSubmissionStrategy(
    agencyCode: string,
    _criteria: StrategyCriteria,
  ): RegulatorySubmissionStrategy | undefined {
    // Find strategy that can handle the agency
    return this.submissionStrategies.find((strategy) =>
      strategy.canHandle(agencyCode),
    );
  }

  private selectFormatStrategy(
    format: string,
    _criteria: StrategyCriteria,
  ): RegulatoryReportFormatStrategy | undefined {
    // Find strategy that can handle the format
    return this.formatStrategies.find((strategy) => strategy.canHandle(format));
  }

  /**
   * Add a custom submission strategy
   */
  addSubmissionStrategy(strategy: RegulatorySubmissionStrategy): void {
    this.submissionStrategies.push(strategy);
    this.logger.log(
      `Added custom submission strategy: ${strategy.getAgencyCode()}`,
    );
  }

  /**
   * Add a custom format strategy
   */
  addFormatStrategy(strategy: RegulatoryReportFormatStrategy): void {
    this.formatStrategies.push(strategy);
    this.logger.log(
      `Added custom format strategy: ${strategy.getFormatType()}`,
    );
  }

  /**
   * Remove a submission strategy
   */
  removeSubmissionStrategy(agencyCode: string): boolean {
    const index = this.submissionStrategies.findIndex(
      (s) => s.getAgencyCode() === agencyCode,
    );
    if (index !== -1) {
      this.submissionStrategies.splice(index, 1);
      this.logger.log(`Removed submission strategy: ${agencyCode}`);
      return true;
    }
    return false;
  }

  /**
   * Remove a format strategy
   */
  removeFormatStrategy(formatType: string): boolean {
    const index = this.formatStrategies.findIndex(
      (s) => s.getFormatType() === formatType,
    );
    if (index !== -1) {
      this.formatStrategies.splice(index, 1);
      this.logger.log(`Removed format strategy: ${formatType}`);
      return true;
    }
    return false;
  }
}
