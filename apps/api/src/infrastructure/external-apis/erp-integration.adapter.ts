import { Injectable, Logger, Inject } from '@nestjs/common';
import type {
  InvoiceData,
  ErpSubmissionResult,
  ErpInvoiceStatus,
} from './regulatory-api.adapter';
import { CircuitBreakerService } from '../../common/resilience/circuit-breaker.service';
import { RetryService } from '../../common/resilience/retry.service';
import { RESILIENCE_CONFIG } from '../../common/resilience/resilience.config';
import { ErrorFactory } from '../../common/errors/domain-errors';

/**
 * Anti-Corruption Layer Interface for ERP integration
 */
export interface IErpAdapter {
  submitInvoice(invoice: InvoiceData): Promise<ErpSubmissionResult>;
  getInvoiceStatus(invoiceId: string): Promise<ErpInvoiceStatus>;
  syncInvoice(invoiceId: string): Promise<void>;
}

/**
 * HTTP Client interface for ERP integration
 */
interface HttpClient {
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
 * Domain models for ERP integration
 * These represent our internal business concepts
 */

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: 'WIRE' | 'ACH' | 'CHECK';
  referenceNumber: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}

export interface GeneralLedgerEntry {
  transactionId: string;
  accountCode: string;
  description: string;
  debitAmount?: number;
  creditAmount?: number;
  transactionDate: Date;
  wellId?: string;
  leaseId?: string;
  costCenter: string;
  reference: string;
}

/**
 * External ERP system formats
 * These represent the data structures used by external ERP systems
 */
interface ERPInvoicePayload {
  external_invoice_id: string;
  supplier_code: string;
  supplier_name: string;
  invoice_ref: string;
  total_amount: number;
  currency_code: string;
  due_date: string; // YYYY-MM-DD format
  invoice_date: string;
  line_items: Array<{
    item_desc: string;
    qty: number;
    unit_cost: number;
    line_total: number;
    project_code?: string;
    department_code?: string;
  }>;
  approval_workflow_status: string;
  company_id: string;
}

interface ERPPaymentPayload {
  payment_id: string;
  invoice_reference: string;
  payment_amount: number;
  currency: string;
  payment_execution_date: string;
  payment_type: string;
  payment_reference: string;
  payment_status: string;
}

interface ERPGLEntry {
  transaction_ref: string;
  gl_account: string;
  transaction_desc: string;
  debit_amt?: number;
  credit_amt?: number;
  posting_date: string;
  project_id?: string;
  lease_ref?: string;
  cost_center_code: string;
  source_reference: string;
}

interface ERPResponse {
  success: boolean;
  external_id?: string;
  transaction_number?: string;
  processing_date: string;
  errors?: Array<{
    error_code: string;
    error_message: string;
    field_name?: string;
  }>;
}

/**
 * ERP Integration Adapter
 * Anti-Corruption Layer for ERP system integration
 *
 * This adapter handles:
 * 1. Invoice processing and approval workflows
 * 2. Payment processing and tracking
 * 3. General ledger entries
 * 4. Account reconciliation
 */
@Injectable()
export class ERPIntegrationAdapter implements IErpAdapter {
  private readonly logger = new Logger(ERPIntegrationAdapter.name);

  constructor(
    private readonly httpClient: HttpClient,
    private readonly erpBaseUrl: string,
    private readonly erpApiKey: string,
    private readonly companyId: string,
    @Inject(CircuitBreakerService)
    private readonly circuitBreakerService: CircuitBreakerService,
    @Inject(RetryService)
    private readonly retryService: RetryService,
  ) {
    // Register circuit breaker for ERP service
    this.circuitBreakerService.registerCircuitBreaker('erp', {
      failureThreshold: RESILIENCE_CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
      recoveryTimeoutMs: RESILIENCE_CONFIG.CIRCUIT_BREAKER.RECOVERY_TIMEOUT_MS,
      halfOpenMaxCalls: RESILIENCE_CONFIG.CIRCUIT_BREAKER.HALF_OPEN_MAX_CALLS,
    });
  }

  /**
   * Submit invoice to ERP system for processing
   */
  async submitInvoice(
    domainInvoice: InvoiceData,
  ): Promise<ErpSubmissionResult> {
    try {
      this.logger.log(
        `Submitting invoice ${domainInvoice.invoiceNumber} to ERP system`,
      );

      // Execute with circuit breaker and retry
      const result = await this.circuitBreakerService.execute(
        'erp',
        async () =>
          await this.retryService.executeWithExponentialBackoff(
            async () => {
              const erpPayload =
                this.translateInvoiceToERPFormat(domainInvoice);
              const headers = this.buildERPHeaders();

              const response = await this.httpClient.post<ERPResponse>(
                `${this.erpBaseUrl}/api/v2/invoices/submit`,
                erpPayload as unknown as Record<string, unknown>,
                { headers },
              );

              return this.translateERPResponse(response.data);
            },
            3, // max attempts
            1000, // initial delay
            `submit-invoice-${domainInvoice.invoiceNumber}`,
          ),
        `submit-invoice-${domainInvoice.invoiceNumber}`,
      );

      this.logger.log(
        `Successfully submitted invoice ${domainInvoice.invoiceNumber} to ERP`,
      );
      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Circuit breaker is')
      ) {
        throw ErrorFactory.circuitBreakerOpen('erp', 'submit-invoice');
      }

      this.logger.error(
        `Failed to submit invoice ${domainInvoice.invoiceNumber} to ERP`,
        error,
      );

      if (error instanceof Error) {
        throw ErrorFactory.externalApi(error.message, 'erp', 'submit-invoice', {
          invoiceNumber: domainInvoice.invoiceNumber,
        });
      }

      throw ErrorFactory.externalApi(
        'Unknown error occurred',
        'erp',
        'submit-invoice',
        { invoiceNumber: domainInvoice.invoiceNumber },
      );
    }
  }

  /**
   * Process payment through ERP system
   */
  async processPayment(domainPayment: PaymentRecord): Promise<{
    success: boolean;
    erpPaymentId?: string;
    confirmationNumber?: string;
    processedAt?: Date;
    errors?: string[];
  }> {
    try {
      this.logger.log(
        `Processing payment ${domainPayment.id} through ERP system`,
      );

      const erpPayload = this.translatePaymentToERPFormat(domainPayment);
      const headers = this.buildERPHeaders();

      const response = await this.httpClient.post<ERPResponse>(
        `${this.erpBaseUrl}/api/v2/payments/process`,
        erpPayload as unknown as Record<string, unknown>,
        { headers },
      );

      const result = this.translateERPResponse(response.data);
      return {
        ...result,
        processedAt: result.success ? new Date() : undefined,
        erpPaymentId: result.erpInvoiceId, // Reuse field
        confirmationNumber: result.processingNumber,
      };
    } catch (error) {
      this.logger.error(`Failed to process payment ${domainPayment.id}`, error);
      const errorResult = this.handleERPError(error, 'PAYMENT_PROCESSING');
      return {
        success: errorResult.success,
        errors: errorResult.errors,
      };
    }
  }

  /**
   * Submit general ledger entries to ERP
   */
  async submitGLEntries(entries: GeneralLedgerEntry[]): Promise<{
    success: boolean;
    processedCount: number;
    failedEntries: Array<{ entryId: string; errors: string[] }>;
  }> {
    try {
      this.logger.log(`Submitting ${entries.length} GL entries to ERP system`);

      const erpEntries = entries.map((entry) =>
        this.translateGLEntryToERPFormat(entry),
      );
      const headers = this.buildERPHeaders();

      const response = await this.httpClient.post<{
        success: boolean;
        processed_count: number;
        failed_entries?: Array<{
          transaction_ref: string;
          errors: Array<{ error_code: string; error_message: string }>;
        }>;
      }>(
        `${this.erpBaseUrl}/api/v2/gl/batch-submit`,
        { entries: erpEntries } as unknown as Record<string, unknown>,
        { headers },
      );

      return {
        success: response.data.success,
        processedCount: response.data.processed_count,
        failedEntries: (response.data.failed_entries || []).map((failed) => ({
          entryId: failed.transaction_ref,
          errors: failed.errors.map((e) => e.error_message),
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to submit GL entries batch`, error);
      return {
        success: false,
        processedCount: 0,
        failedEntries: entries.map((entry) => ({
          entryId: entry.transactionId,
          errors: ['Batch submission failed'],
        })),
      };
    }
  }

  /**
   * Get account balance from ERP system
   */
  async getAccountBalance(
    accountCode: string,
    asOfDate?: Date,
  ): Promise<{
    accountCode: string;
    balance: number;
    currency: string;
    asOfDate: Date;
  }> {
    try {
      const dateParam = asOfDate
        ? `?as_of_date=${asOfDate.toISOString().split('T')[0]}`
        : '';
      const headers = this.buildERPHeaders();

      const response = await this.httpClient.get<{
        account_code: string;
        current_balance: number;
        currency: string;
        balance_date: string;
      }>(
        `${this.erpBaseUrl}/api/v2/accounts/${accountCode}/balance${dateParam}`,
        { headers },
      );

      return {
        accountCode: response.data.account_code,
        balance: response.data.current_balance,
        currency: response.data.currency,
        asOfDate: new Date(response.data.balance_date),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get balance for account ${accountCode}`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Unable to retrieve account balance: ${errorMessage}`);
    }
  }

  /**
   * TRANSLATION METHODS - Anti-Corruption Layer core functionality
   */

  private translateInvoiceToERPFormat(
    domainInvoice: InvoiceData,
  ): ERPInvoicePayload {
    return {
      external_invoice_id: domainInvoice.id,
      supplier_code: domainInvoice.vendorId,
      supplier_name: domainInvoice.vendorName,
      invoice_ref: domainInvoice.invoiceNumber,
      total_amount: domainInvoice.amount,
      currency_code: domainInvoice.currency,
      due_date: domainInvoice.dueDate?.toISOString().split('T')[0] || '',
      invoice_date: domainInvoice.issueDate?.toISOString().split('T')[0] || '',
      line_items: domainInvoice.lineItems.map((item) => ({
        item_desc: item.description,
        qty: item.quantity,
        unit_cost: item.unitPrice,
        line_total: item.totalAmount,
        project_code: item.wellId,
        department_code: item.costCenter,
      })),
      approval_workflow_status: this.mapApprovalStatus(
        domainInvoice.approvalStatus,
      ),
      company_id: this.companyId,
    };
  }

  private translatePaymentToERPFormat(
    domainPayment: PaymentRecord,
  ): ERPPaymentPayload {
    return {
      payment_id: domainPayment.id,
      invoice_reference: domainPayment.invoiceId,
      payment_amount: domainPayment.amount,
      currency: domainPayment.currency,
      payment_execution_date:
        domainPayment.paymentDate?.toISOString().split('T')[0] || '',
      payment_type: this.mapPaymentMethod(domainPayment.paymentMethod),
      payment_reference: domainPayment.referenceNumber,
      payment_status: this.mapPaymentStatus(domainPayment.status),
    };
  }

  private translateGLEntryToERPFormat(
    domainEntry: GeneralLedgerEntry,
  ): ERPGLEntry {
    return {
      transaction_ref: domainEntry.transactionId,
      gl_account: domainEntry.accountCode,
      transaction_desc: domainEntry.description,
      debit_amt: domainEntry.debitAmount,
      credit_amt: domainEntry.creditAmount,
      posting_date:
        domainEntry.transactionDate?.toISOString().split('T')[0] || '',
      project_id: domainEntry.wellId,
      lease_ref: domainEntry.leaseId,
      cost_center_code: domainEntry.costCenter,
      source_reference: domainEntry.reference,
    };
  }

  private translateERPResponse(erpResponse: ERPResponse): ErpSubmissionResult {
    return {
      success: erpResponse.success,
      erpInvoiceId: erpResponse.external_id,
      processingNumber: erpResponse.transaction_number,
      submittedAt: new Date(),
      errors:
        erpResponse.errors?.map((e) => `${e.error_code}: ${e.error_message}`) ||
        [],
    };
  }

  async getInvoiceStatus(invoiceId: string): Promise<ErpInvoiceStatus> {
    try {
      const headers = this.buildERPHeaders();
      const response = await this.httpClient.get<{
        status: string;
        amount?: number;
        paid_date?: string;
        last_updated: string;
      }>(`${this.erpBaseUrl}/api/v2/invoices/${invoiceId}/status`, { headers });

      return {
        status: this.mapERPStatusToDomain(response.data.status),
        lastUpdated: new Date(response.data.last_updated),
        amount: response.data.amount,
        paidDate: response.data.paid_date
          ? new Date(response.data.paid_date)
          : undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to get invoice status for ${invoiceId}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve invoice status: ${errorMessage}`);
    }
  }

  async syncInvoice(invoiceId: string): Promise<void> {
    try {
      this.logger.log(`Syncing invoice ${invoiceId} with ERP system`);
      const headers = this.buildERPHeaders();

      await this.httpClient.post(
        `${this.erpBaseUrl}/api/v2/invoices/${invoiceId}/sync`,
        {},
        { headers },
      );

      this.logger.log(`Successfully synced invoice ${invoiceId}`);
    } catch (error) {
      this.logger.error(`Failed to sync invoice ${invoiceId}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to sync invoice: ${errorMessage}`);
    }
  }

  /**
   * MAPPING METHODS
   */

  private mapERPStatusToDomain(erpStatus: string): ErpInvoiceStatus['status'] {
    switch (erpStatus) {
      case 'DRAFT':
        return 'DRAFT';
      case 'PENDING_APPROVAL':
        return 'SUBMITTED';
      case 'APPROVED':
        return 'APPROVED';
      case 'PAID':
        return 'PAID';
      case 'REJECTED':
      case 'CANCELLED':
        return 'REJECTED';
      default:
        return 'DRAFT';
    }
  }

  private mapApprovalStatus(
    domainStatus: InvoiceData['approvalStatus'],
  ): string {
    switch (domainStatus) {
      case 'PENDING':
        return 'PENDING_APPROVAL';
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return 'UNKNOWN';
    }
  }

  private mapPaymentMethod(
    domainMethod: PaymentRecord['paymentMethod'],
  ): string {
    switch (domainMethod) {
      case 'WIRE':
        return 'WIRE_TRANSFER';
      case 'ACH':
        return 'ACH_PAYMENT';
      case 'CHECK':
        return 'CHECK_PAYMENT';
      default:
        return 'UNKNOWN';
    }
  }

  private mapPaymentStatus(domainStatus: PaymentRecord['status']): string {
    switch (domainStatus) {
      case 'PENDING':
        return 'PENDING_EXECUTION';
      case 'PROCESSED':
        return 'EXECUTED';
      case 'FAILED':
        return 'FAILED';
      default:
        return 'UNKNOWN';
    }
  }

  private buildERPHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `API-Key ${this.erpApiKey}`,
      'X-Company-ID': this.companyId,
      'X-API-Version': '2.0',
      'User-Agent': 'WellFlow-ERP-Integration/1.0',
    };
  }

  private handleERPError(
    error: unknown,
    operation: string,
  ): ErpSubmissionResult {
    const errorObj = error as {
      response?: { data?: { message?: string }; status?: number };
      message?: string;
    };
    const errorMessage =
      errorObj?.response?.data?.message ||
      errorObj?.message ||
      'Unknown ERP error';
    const statusCode = errorObj?.response?.status;

    this.logger.error(
      `ERP ${operation} failed with status ${statusCode}: ${errorMessage}`,
    );

    const errors = [];

    if (statusCode === 400) {
      errors.push(`Invalid data format: ${errorMessage}`);
    } else if (statusCode === 401) {
      errors.push('ERP authentication failed - please check API credentials');
    } else if (statusCode === 403) {
      errors.push('Insufficient permissions for ERP operation');
    } else if (statusCode === 429) {
      errors.push('ERP rate limit exceeded - please retry later');
    } else if (statusCode && statusCode >= 500) {
      errors.push('ERP system temporarily unavailable');
    } else {
      errors.push(`ERP integration failed: ${errorMessage}`);
    }

    return {
      success: false,
      submittedAt: new Date(),
      errors,
    };
  }
}
