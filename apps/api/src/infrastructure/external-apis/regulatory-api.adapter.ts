import { Injectable, Logger, Inject } from '@nestjs/common';
import { CircuitBreakerService } from '../../common/resilience/circuit-breaker.service';
import { RetryService } from '../../common/resilience/retry.service';
import { RESILIENCE_CONFIG } from '../../common/resilience/resilience.config';
import { ErrorFactory } from '../../common/errors/domain-errors';
import { AuditLogService } from '../../application/services/audit-log.service';

/**
 * Anti-Corruption Layer Interfaces
 * These define the contracts for translating between domain and external systems
 */
export interface IRegulatoryApiAdapter {
  submitReport(domainReport: RegulatoryReport): Promise<SubmissionResult>;
  getSubmissionStatus(externalReferenceId: string): Promise<SubmissionStatus>;
  validateReport(domainReport: RegulatoryReport): Promise<ValidationResult>;
}

export interface IErpAdapter {
  submitInvoice(invoice: InvoiceData): Promise<ErpSubmissionResult>;
  getInvoiceStatus(invoiceId: string): Promise<ErpInvoiceStatus>;
  syncInvoice(invoiceId: string): Promise<void>;
}

/**
 * Domain model for regulatory reports
 * This represents our internal domain model
 */
export interface RegulatoryReport {
  id: string;
  wellId: string;
  reportType: 'PRODUCTION' | 'DRILLING' | 'COMPLETION' | 'ENVIRONMENTAL';
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  data: {
    oilProduction?: number; // barrels
    gasProduction?: number; // MCF
    waterProduction?: number; // barrels
    incidents?: string[];
    complianceNotes?: string;
  };
  submissionStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionResult {
  success: boolean;
  externalReferenceId?: string;
  confirmationNumber?: string;
  submittedAt: Date;
  errors?: string[];
  warnings?: string[];
}

export interface SubmissionStatus {
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'UNKNOWN';
  lastUpdated: Date;
  details?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ErpSubmissionResult {
  success: boolean;
  erpInvoiceId?: string;
  processingNumber?: string;
  submittedAt: Date;
  errors?: string[];
}

export interface ErpInvoiceStatus {
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  lastUpdated: Date;
  amount?: number;
  paidDate?: Date;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: string;
  issueDate: Date;
  dueDate?: Date;
  lineItems: InvoiceLineItem[];
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  wellId?: string;
  costCenter?: string;
}

/**
 * External API response formats
 * These represent the formats used by external regulatory systems
 */
interface ExternalRegulatorySubmission {
  report_id: string;
  well_identifier: string;
  report_classification: string;
  period_start: string; // ISO date string
  period_end: string; // ISO date string
  production_volumes: {
    oil_bbl?: number;
    gas_mcf?: number;
    water_bbl?: number;
  };
  regulatory_notes?: string;
  incident_reports?: string[];
  operator_id: string;
  submission_timestamp: string;
}

interface ExternalSubmissionResponse {
  status: 'success' | 'error' | 'warning';
  reference_number?: string;
  confirmation_id?: string;
  submission_date: string;
  validation_errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  validation_warnings?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * External API error types
 */

/**
 * HTTP Client Interface
 * Abstraction over actual HTTP implementation
 */
export interface HttpClient {
  post<T = Record<string, unknown>>(
    url: string,
    data: Record<string, unknown>,
    config?: { headers?: Record<string, string> },
  ): Promise<{ data: T }>;
  get<T = Record<string, unknown>>(
    url: string,
    config?: { headers?: Record<string, string> },
  ): Promise<{ data: T }>;
  put<T = Record<string, unknown>>(
    url: string,
    data: Record<string, unknown>,
    config?: { headers?: Record<string, string> },
  ): Promise<{ data: T }>;
  delete<T = Record<string, unknown>>(
    url: string,
    config?: { headers?: Record<string, string> },
  ): Promise<{ data: T }>;
}

/**
 * Regulatory API Adapter
 * Anti-Corruption Layer for external regulatory reporting systems
 *
 * This adapter:
 * 1. Translates between domain models and external API formats
 * 2. Handles external API communication
 * 3. Provides error mapping and handling
 * 4. Ensures domain integrity by preventing external models from leaking in
 */
@Injectable()
export class RegulatoryApiAdapter implements IRegulatoryApiAdapter {
  private readonly logger = new Logger(RegulatoryApiAdapter.name);
  private readonly SERVICE_NAME = 'regulatory-api';

  constructor(
    private readonly httpClient: HttpClient,
    private readonly apiBaseUrl: string,
    private readonly apiKey: string,
    @Inject(CircuitBreakerService)
    private readonly circuitBreakerService: CircuitBreakerService,
    @Inject(RetryService)
    private readonly retryService: RetryService,
    private readonly auditLogService: AuditLogService,
  ) {
    // Register circuit breaker for regulatory API
    this.circuitBreakerService.registerCircuitBreaker(this.SERVICE_NAME, {
      failureThreshold: RESILIENCE_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
      recoveryTimeoutMs: RESILIENCE_CONFIG.CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS,
      halfOpenMaxCalls: RESILIENCE_CONFIG.CIRCUIT_BREAKER.HALF_OPEN_MAX_CALLS,
    });
  }

  /**
   * Submit regulatory report to external system
   */
  async submitReport(
    domainReport: RegulatoryReport,
  ): Promise<SubmissionResult> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Submitting regulatory report ${domainReport.id} for well ${domainReport.wellId}`,
      );

      // Execute with circuit breaker and retry
      const result = await this.circuitBreakerService.execute(
        this.SERVICE_NAME,
        async () =>
          await this.retryService.executeWithExponentialBackoff(
            async () => {
              // Translate domain model to external format
              const externalPayload =
                this.translateToExternalFormat(domainReport);

              // Make API call with proper headers
              const headers = this.buildHeaders();
              const response =
                await this.httpClient.post<ExternalSubmissionResponse>(
                  `${this.apiBaseUrl}/v1/reports/submit`,
                  externalPayload as unknown as Record<string, unknown>,
                  { headers },
                );

              // Translate response back to domain format
              return this.translateSubmissionResponse(response.data);
            },
            3, // max attempts
            1000, // initial delay
            `submit-report-${domainReport.id}`,
          ),
        `submit-report-${domainReport.id}`,
      );

      const duration = Date.now() - startTime;

      // Audit logging for successful external API call
      await this.auditLogService.logApiCall(
        this.SERVICE_NAME,
        'reports/submit',
        'POST',
        true,
        undefined,
        duration,
        {
          reportId: domainReport.id,
          wellId: domainReport.wellId,
          externalSubmissionId: result.submissionId,
          businessContext: {
            reportType: domainReport.reportType,
            periodStart: domainReport.periodStart,
            periodEnd: domainReport.periodEnd,
          },
        },
      );

      this.logger.log(
        `Successfully submitted regulatory report ${domainReport.id}`,
      );
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Audit logging for failed external API call
      await this.auditLogService.logApiCall(
        this.SERVICE_NAME,
        'reports/submit',
        'POST',
        false,
        errorMessage,
        duration,
        {
          reportId: domainReport.id,
          wellId: domainReport.wellId,
          businessContext: {
            reportType: domainReport.reportType,
            periodStart: domainReport.periodStart,
            periodEnd: domainReport.periodEnd,
          },
        },
      );

      if (
        error instanceof Error &&
        error.message.includes('Circuit breaker is')
      ) {
        throw ErrorFactory.circuitBreakerOpen(
          this.SERVICE_NAME,
          'submit-report',
        );
      }

      this.logger.error(
        `Failed to submit regulatory report ${domainReport.id}`,
        error,
      );

      if (error instanceof Error) {
        throw ErrorFactory.externalApi(
          error.message,
          this.SERVICE_NAME,
          'submit-report',
          { reportId: domainReport.id, wellId: domainReport.wellId },
        );
      }

      throw ErrorFactory.externalApi(
        'Unknown error occurred',
        this.SERVICE_NAME,
        'submit-report',
        { reportId: domainReport.id, wellId: domainReport.wellId },
      );
    }
  }

  /**
   * Check submission status from external system
   */
  async getSubmissionStatus(
    externalReferenceId: string,
  ): Promise<SubmissionStatus> {
    try {
      const headers = this.buildHeaders();
      const response = await this.httpClient.get<{
        status: string;
        last_modified: string;
        notes?: string;
      }>(
        `${this.apiBaseUrl}/v1/reports/status/${externalReferenceId}`,
        headers,
      );

      return {
        status: this.mapExternalStatus(
          response.data.status,
        ) as SubmissionStatus['status'],
        lastUpdated: new Date(response.data.last_modified),
        details: response.data.notes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to check status for reference ${externalReferenceId}`,
        error,
      );
      throw ErrorFactory.externalApi(
        `Unable to retrieve submission status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.SERVICE_NAME,
        'get-submission-status',
      );
    }
  }

  /**
   * Validate report before submission
   */
  async validateReport(
    domainReport: RegulatoryReport,
  ): Promise<ValidationResult> {
    try {
      const externalPayload = this.translateToExternalFormat(domainReport);
      const headers = this.buildHeaders();

      const response = await this.httpClient.post<{
        valid: boolean;
        errors: Array<{ message: string }>;
        warnings: Array<{ message: string }>;
      }>(
        `${this.apiBaseUrl}/v1/reports/validate`,
        externalPayload as unknown as Record<string, unknown>,
        { headers },
      );

      return {
        isValid: response.data.valid === true,
        errors: (response.data.errors || []).map(
          (e: unknown) => (e as { message: string }).message,
        ),
        warnings: (response.data.warnings || []).map(
          (w: unknown) => (w as { message: string }).message,
        ),
      };
    } catch (error) {
      this.logger.warn(
        `Validation failed for report ${domainReport.id}`,
        error,
      );
      return {
        isValid: false,
        errors: [
          `Validation service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        warnings: [],
      };
    }
  }

  /**
   * TRANSLATION METHODS - Core Anti-Corruption Layer functionality
   */

  /**
   * Translate domain model to external API format
   */
  private translateToExternalFormat(
    domainReport: RegulatoryReport,
  ): ExternalRegulatorySubmission {
    return {
      report_id: domainReport.id,
      well_identifier: domainReport.wellId,
      report_classification: this.mapReportType(domainReport.reportType),
      period_start: domainReport.reportingPeriod.startDate.toISOString(),
      period_end: domainReport.reportingPeriod.endDate.toISOString(),
      production_volumes: {
        oil_bbl: domainReport.data.oilProduction,
        gas_mcf: domainReport.data.gasProduction,
        water_bbl: domainReport.data.waterProduction,
      },
      regulatory_notes: domainReport.data.complianceNotes,
      incident_reports: domainReport.data.incidents,
      operator_id: domainReport.organizationId,
      submission_timestamp: new Date().toISOString(),
    };
  }

  /**
   * Translate external response to domain format
   */
  private translateSubmissionResponse(
    externalResponse: ExternalSubmissionResponse,
  ): SubmissionResult {
    const success = externalResponse.status === 'success';

    return {
      success,
      externalReferenceId: externalResponse.reference_number,
      confirmationNumber: externalResponse.confirmation_id,
      submittedAt: new Date(externalResponse.submission_date),
      errors:
        externalResponse.validation_errors?.map(
          (e) => `${e.field}: ${e.message}`,
        ) || [],
      warnings:
        externalResponse.validation_warnings?.map(
          (w) => `${w.field}: ${w.message}`,
        ) || [],
    };
  }

  /**
   * Map domain report types to external system classifications
   */
  private mapReportType(domainType: RegulatoryReport['reportType']): string {
    switch (domainType) {
      case 'PRODUCTION':
        return 'PROD_RPT';
      case 'DRILLING':
        return 'DRILL_RPT';
      case 'COMPLETION':
        return 'COMP_RPT';
      case 'ENVIRONMENTAL':
        return 'ENV_RPT';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Map external status to domain status
   */
  private mapExternalStatus(externalStatus: string): string {
    switch (externalStatus) {
      case 'RECEIVED':
      case 'PROCESSING':
      case 'PENDING_REVIEW':
        return 'SUBMITTED';
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Build HTTP headers for external API calls
   */
  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      'X-API-Version': '1.0',
      'User-Agent': 'WellFlow/1.0',
    };
  }

  /**
   * Handle errors from external API calls
   */
  private handleSubmissionError(error: unknown): SubmissionResult {
    const errorObj = error as {
      response?: {
        data?: { message?: string; validation_errors?: unknown[] };
        status?: number;
      };
      message?: string;
    };
    const errorMessage =
      errorObj?.response?.data?.message || errorObj?.message || 'Unknown error';
    const statusCode = errorObj?.response?.status;

    // Map different error types
    if (statusCode === 400) {
      // Validation errors
      const validationErrors =
        errorObj?.response?.data?.validation_errors || [];
      return {
        success: false,
        submittedAt: new Date(),
        errors: validationErrors.map(
          (e: unknown) =>
            `${(e as { field?: string; message?: string }).field}: ${(e as { field?: string; message?: string }).message}`,
        ),
        warnings: [],
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      return {
        success: false,
        submittedAt: new Date(),
        errors: ['Authentication failed - please check API credentials'],
        warnings: [],
      };
    }

    if (statusCode && statusCode >= 500) {
      return {
        success: false,
        submittedAt: new Date(),
        errors: [
          'External service temporarily unavailable - please try again later',
        ],
        warnings: [],
      };
    }

    // Default error handling
    return {
      success: false,
      submittedAt: new Date(),
      errors: [`Submission failed: ${errorMessage}`],
      warnings: [],
    };
  }
}
