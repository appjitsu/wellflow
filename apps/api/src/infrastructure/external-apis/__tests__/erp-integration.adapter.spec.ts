import { ERPIntegrationAdapter } from '../erp-integration.adapter';
import { InvoiceData, HttpClient } from '../regulatory-api.adapter';

describe('ERPIntegrationAdapter', () => {
  let service: ERPIntegrationAdapter;
  let httpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    } as any;

    const mockSSRFProtectionService = {
      validateURL: jest.fn().mockResolvedValue({
        isAllowed: true,
        requestId: 'test-request-id',
      }),
    };

    // Mock the constructor dependencies
    service = new (ERPIntegrationAdapter as any)(
      httpClient,
      'https://api.erp-system.com',
      'erp-api-key',
      'company-123',
      { registerCircuitBreaker: jest.fn(), execute: jest.fn() },
      { executeWithExponentialBackoff: jest.fn() },
      mockSSRFProtectionService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitInvoice', () => {
    it('should submit invoice successfully', async () => {
      const mockInvoice: InvoiceData = {
        id: 'inv-123',
        invoiceNumber: 'INV-2024-001',
        vendorId: 'vendor-456',
        vendorName: 'ABC Supplies Inc.',
        amount: 15000.0,
        currency: 'USD',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        lineItems: [],
        approvalStatus: 'APPROVED',
      };

      httpClient.post.mockResolvedValue({
        data: {
          success: true,
          external_id: 'ERP-INV-789',
          transaction_number: 'PROC-123',
          processing_date: '2024-01-15T10:00:00Z',
        },
      });

      // Mock circuit breaker and retry
      (service as any).circuitBreakerService.execute.mockImplementation(
        (serviceName: string, fn: any) => fn(),
      );
      (
        service as any
      ).retryService.executeWithExponentialBackoff.mockImplementation(
        (fn: any) => fn(),
      );

      const result = await service.submitInvoice(mockInvoice);

      expect(result.success).toBe(true);
      expect(result.erpInvoiceId).toBe('ERP-INV-789');
      expect(result.processingNumber).toBe('PROC-123');
      expect(httpClient.post).toHaveBeenCalledWith(
        'https://api.erp-system.com/api/v2/invoices/submit',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should handle submission failure', async () => {
      const mockInvoice: InvoiceData = {
        id: 'inv-123',
        invoiceNumber: 'INV-2024-001',
        vendorId: 'vendor-456',
        vendorName: 'ABC Supplies Inc.',
        amount: 15000.0,
        currency: 'USD',
        issueDate: new Date('2024-01-15'),
        dueDate: new Date('2024-02-15'),
        lineItems: [],
        approvalStatus: 'APPROVED',
      };

      httpClient.post.mockResolvedValue({
        data: {
          success: false,
          errors: [
            {
              error_code: 'VALIDATION_ERROR',
              error_message: 'Invalid vendor code',
            },
          ],
          processing_date: '2024-01-15T10:00:00Z',
        },
      });

      // Mock circuit breaker and retry
      (service as any).circuitBreakerService.execute.mockImplementation(
        (serviceName: string, fn: any) => fn(),
      );
      (
        service as any
      ).retryService.executeWithExponentialBackoff.mockImplementation(
        (fn: any) => fn(),
      );

      const result = await service.submitInvoice(mockInvoice);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('VALIDATION_ERROR: Invalid vendor code');
    });
  });

  describe('getInvoiceStatus', () => {
    it('should get invoice status successfully', async () => {
      const invoiceId = 'ERP-INV-789';

      httpClient.get.mockResolvedValue({
        data: {
          status: 'APPROVED',
          amount: 15000.0,
          paid_date: '2024-02-01T00:00:00Z',
          last_updated: '2024-01-20T10:00:00Z',
        },
      });

      const result = await service.getInvoiceStatus(invoiceId);

      expect(result.status).toBe('APPROVED');
      expect(result.amount).toBe(15000.0);
      expect(result.paidDate).toEqual(new Date('2024-02-01T00:00:00Z'));
      expect(result.lastUpdated).toEqual(new Date('2024-01-20T10:00:00Z'));
      expect(httpClient.get).toHaveBeenCalledWith(
        'https://api.erp-system.com/api/v2/invoices/ERP-INV-789/status',
        expect.any(Object),
      );
    });

    it('should handle invoice not found', async () => {
      const invoiceId = 'ERP-INV-999';

      httpClient.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Invoice not found' } },
      });

      await expect(service.getInvoiceStatus(invoiceId)).rejects.toThrow(
        'Failed to retrieve invoice status',
      );
    });
  });

  describe('syncInvoice', () => {
    it('should sync invoice successfully', async () => {
      const invoiceId = 'ERP-INV-789';

      httpClient.post.mockResolvedValue({ data: {} });

      await expect(service.syncInvoice(invoiceId)).resolves.toBeUndefined();

      expect(httpClient.post).toHaveBeenCalledWith(
        'https://api.erp-system.com/api/v2/invoices/ERP-INV-789/sync',
        {},
        expect.any(Object),
      );
    });

    it('should handle sync failure', async () => {
      const invoiceId = 'ERP-INV-789';

      httpClient.post.mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } },
      });

      await expect(service.syncInvoice(invoiceId)).rejects.toThrow(
        'Failed to sync invoice',
      );
    });
  });
});
