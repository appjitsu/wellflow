import {
  RegulatoryApiAdapter,
  RegulatoryReport,
  SubmissionResult,
  SubmissionStatus,
  ValidationResult,
  HttpClient,
} from '../regulatory-api.adapter';
import { CircuitBreakerService } from '../../../common/resilience/circuit-breaker.service';
import { RetryService } from '../../../common/resilience/retry.service';
import { AuditLogService } from '../../../application/services/audit-log.service';

describe('RegulatoryApiAdapter', () => {
  let service: RegulatoryApiAdapter;
  let httpClient: jest.Mocked<HttpClient>;
  let circuitBreakerService: jest.Mocked<CircuitBreakerService>;
  let retryService: jest.Mocked<RetryService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockApiBaseUrl = 'https://api.regulatory.gov';
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    httpClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    circuitBreakerService = {
      registerCircuitBreaker: jest.fn(),
      execute: jest.fn(),
    } as any;

    retryService = {
      executeWithExponentialBackoff: jest.fn(),
    } as any;

    auditLogService = {
      logApiCall: jest.fn(),
    } as any;

    service = new RegulatoryApiAdapter(
      httpClient as HttpClient,
      mockApiBaseUrl,
      mockApiKey,
      circuitBreakerService,
      retryService,
      auditLogService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitReport', () => {
    const mockReport: RegulatoryReport = {
      id: 'report-123',
      wellId: 'well-456',
      reportType: 'PRODUCTION',
      reportingPeriod: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      },
      data: {
        oilProduction: 1000,
        gasProduction: 5000,
        waterProduction: 200,
        incidents: ['Minor spill'],
        complianceNotes: 'All regulations met',
      },
      submissionStatus: 'DRAFT',
      organizationId: 'org-789',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    };

    const mockExternalResponse = {
      status: 'success' as const,
      reference_number: 'EXT-REF-123',
      confirmation_id: 'CONF-456',
      submission_date: '2024-01-15T10:00:00Z',
    };

    it('should successfully submit a report', async () => {
      httpClient.post.mockResolvedValue({ data: mockExternalResponse });
      circuitBreakerService.execute.mockImplementation(
        async (serviceName, fn) => fn(),
      );
      retryService.executeWithExponentialBackoff.mockImplementation(
        async (fn) => fn(),
      );

      const result = await service.submitReport(mockReport);

      expect(result).toEqual({
        success: true,
        externalReferenceId: 'EXT-REF-123',
        confirmationNumber: 'CONF-456',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        errors: [],
        warnings: [],
      });

      expect(httpClient.post).toHaveBeenCalledWith(
        `${mockApiBaseUrl}/v1/reports/submit`,
        expect.objectContaining({
          report_id: 'report-123',
          well_identifier: 'well-456',
          report_classification: 'PROD_RPT',
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        }),
      );

      expect(auditLogService.logApiCall).toHaveBeenCalledWith(
        'regulatory-api',
        'reports/submit',
        'POST',
        true,
        undefined,
        expect.any(Number),
        expect.objectContaining({
          reportId: 'report-123',
          wellId: 'well-456',
        }),
      );
    });

    it('should handle validation errors from external API', async () => {
      const errorResponse = {
        status: 'error' as const,
        submission_date: '2024-01-15T10:00:00Z',
        validation_errors: [
          {
            field: 'oil_production',
            message: 'Must be positive',
            code: 'INVALID_VALUE',
          },
        ],
        validation_warnings: [
          {
            field: 'gas_production',
            message: 'Unusually high',
            code: 'HIGH_VALUE',
          },
        ],
      };

      httpClient.post.mockResolvedValue({ data: errorResponse });
      circuitBreakerService.execute.mockImplementation(
        async (serviceName, fn) => fn(),
      );
      retryService.executeWithExponentialBackoff.mockImplementation(
        async (fn) => fn(),
      );

      const result = await service.submitReport(mockReport);

      expect(result).toEqual({
        success: false,
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        errors: ['oil_production: Must be positive'],
        warnings: ['gas_production: Unusually high'],
      });
    });

    it('should handle HTTP errors', async () => {
      const error = new Error('Network timeout');
      httpClient.post.mockRejectedValue(error);
      circuitBreakerService.execute.mockImplementation(
        async (serviceName, fn) => fn(),
      );
      retryService.executeWithExponentialBackoff.mockImplementation(
        async (fn) => fn(),
      );

      await expect(service.submitReport(mockReport)).rejects.toThrow(
        'External API error',
      );

      expect(auditLogService.logApiCall).toHaveBeenCalledWith(
        'regulatory-api',
        'reports/submit',
        'POST',
        false,
        'Network timeout',
        expect.any(Number),
        expect.objectContaining({
          reportId: 'report-123',
          wellId: 'well-456',
        }),
      );
    });

    it('should handle circuit breaker errors', async () => {
      const circuitBreakerError = new Error('Circuit breaker is OPEN');
      httpClient.post.mockRejectedValue(circuitBreakerError);
      circuitBreakerService.execute.mockImplementation(
        async (serviceName, fn) => fn(),
      );
      retryService.executeWithExponentialBackoff.mockImplementation(
        async (fn) => fn(),
      );

      await expect(service.submitReport(mockReport)).rejects.toThrow(
        'Circuit breaker is open',
      );
    });
  });

  describe('getSubmissionStatus', () => {
    it('should retrieve submission status successfully', async () => {
      const externalReferenceId = 'EXT-REF-123';
      const mockResponse = {
        status: 'APPROVED',
        last_modified: '2024-01-16T14:30:00Z',
        notes: 'Approved with minor corrections',
      };

      httpClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getSubmissionStatus(externalReferenceId);

      expect(result).toEqual({
        status: 'APPROVED',
        lastUpdated: new Date('2024-01-16T14:30:00Z'),
        details: 'Approved with minor corrections',
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        `${mockApiBaseUrl}/v1/reports/status/${externalReferenceId}`,
        {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mockApiKey}`,
          'X-API-Version': '1.0',
          'User-Agent': 'WellFlow/1.0',
        },
      );
    });

    it('should handle unknown external status', async () => {
      const externalReferenceId = 'EXT-REF-123';
      const mockResponse = {
        status: 'SOME_UNKNOWN_STATUS',
        last_modified: '2024-01-16T14:30:00Z',
      };

      httpClient.get.mockResolvedValue({ data: mockResponse });

      const result = await service.getSubmissionStatus(externalReferenceId);

      expect(result.status).toBe('UNKNOWN');
    });

    it('should handle API errors', async () => {
      const externalReferenceId = 'EXT-REF-123';
      httpClient.get.mockRejectedValue(new Error('API unavailable'));

      await expect(
        service.getSubmissionStatus(externalReferenceId),
      ).rejects.toThrow('Unable to retrieve submission status');
    });
  });

  describe('validateReport', () => {
    const mockReport: RegulatoryReport = {
      id: 'report-123',
      wellId: 'well-456',
      reportType: 'PRODUCTION',
      reportingPeriod: {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      },
      data: {
        oilProduction: 1000,
        gasProduction: 5000,
      },
      submissionStatus: 'DRAFT',
      organizationId: 'org-789',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    };

    it('should validate report successfully', async () => {
      const mockResponse = {
        valid: true,
        errors: [],
        warnings: [],
      };

      httpClient.post.mockResolvedValue({ data: mockResponse });

      const result = await service.validateReport(mockReport);

      expect(result).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
      });
    });

    it('should handle validation errors', async () => {
      const mockResponse = {
        valid: false,
        errors: [{ message: 'Oil production cannot be negative' }],
        warnings: [{ message: 'Gas production is unusually high' }],
      };

      httpClient.post.mockResolvedValue({ data: mockResponse });

      const result = await service.validateReport(mockReport);

      expect(result).toEqual({
        isValid: false,
        errors: ['Oil production cannot be negative'],
        warnings: ['Gas production is unusually high'],
      });
    });

    it('should handle API unavailability gracefully', async () => {
      httpClient.post.mockRejectedValue(new Error('Service unavailable'));

      const result = await service.validateReport(mockReport);

      expect(result).toEqual({
        isValid: false,
        errors: ['Validation service unavailable: Service unavailable'],
        warnings: [],
      });
    });
  });

  describe('translation methods', () => {
    describe('translateToExternalFormat', () => {
      it('should translate PRODUCTION report correctly', () => {
        const domainReport: RegulatoryReport = {
          id: 'report-123',
          wellId: 'well-456',
          reportType: 'PRODUCTION',
          reportingPeriod: {
            startDate: new Date('2024-01-01T00:00:00Z'),
            endDate: new Date('2024-01-31T23:59:59Z'),
          },
          data: {
            oilProduction: 1000,
            gasProduction: 5000,
            waterProduction: 200,
            incidents: ['Incident 1'],
            complianceNotes: 'All good',
          },
          submissionStatus: 'DRAFT',
          organizationId: 'org-789',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Access private method for testing
        const result = (service as any).translateToExternalFormat(domainReport);

        expect(result).toEqual({
          report_id: 'report-123',
          well_identifier: 'well-456',
          report_classification: 'PROD_RPT',
          period_start: '2024-01-01T00:00:00.000Z',
          period_end: '2024-01-31T23:59:59.000Z',
          production_volumes: {
            oil_bbl: 1000,
            gas_mcf: 5000,
            water_bbl: 200,
          },
          regulatory_notes: 'All good',
          incident_reports: ['Incident 1'],
          operator_id: 'org-789',
          submission_timestamp: expect.any(String),
        });
      });

      it('should map all report types correctly', () => {
        const testCases = [
          { input: 'PRODUCTION' as const, expected: 'PROD_RPT' },
          { input: 'DRILLING' as const, expected: 'DRILL_RPT' },
          { input: 'COMPLETION' as const, expected: 'COMP_RPT' },
          { input: 'ENVIRONMENTAL' as const, expected: 'ENV_RPT' },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = (service as any).mapReportType(input);
          expect(result).toBe(expected);
        });
      });
    });

    describe('translateSubmissionResponse', () => {
      it('should translate successful response', () => {
        const externalResponse = {
          status: 'success' as const,
          reference_number: 'REF-123',
          confirmation_id: 'CONF-456',
          submission_date: '2024-01-15T10:00:00Z',
          validation_errors: [],
          validation_warnings: [],
        };

        const result = (service as any).translateSubmissionResponse(
          externalResponse,
        );

        expect(result).toEqual({
          success: true,
          externalReferenceId: 'REF-123',
          confirmationNumber: 'CONF-456',
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          errors: [],
          warnings: [],
        });
      });

      it('should translate error response with validation issues', () => {
        const externalResponse = {
          status: 'error' as const,
          submission_date: '2024-01-15T10:00:00Z',
          validation_errors: [
            { field: 'oil', message: 'Required', code: 'MISSING' },
          ],
          validation_warnings: [
            { field: 'gas', message: 'High value', code: 'WARNING' },
          ],
        };

        const result = (service as any).translateSubmissionResponse(
          externalResponse,
        );

        expect(result).toEqual({
          success: false,
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          errors: ['oil: Required'],
          warnings: ['gas: High value'],
        });
      });
    });

    describe('mapExternalStatus', () => {
      it('should map various external statuses to domain statuses', () => {
        const testCases = [
          { input: 'RECEIVED', expected: 'SUBMITTED' },
          { input: 'PROCESSING', expected: 'SUBMITTED' },
          { input: 'PENDING_REVIEW', expected: 'SUBMITTED' },
          { input: 'APPROVED', expected: 'APPROVED' },
          { input: 'REJECTED', expected: 'REJECTED' },
          { input: 'UNKNOWN_STATUS', expected: 'UNKNOWN' },
        ];

        testCases.forEach(({ input, expected }) => {
          const result = (service as any).mapExternalStatus(input);
          expect(result).toBe(expected);
        });
      });
    });
  });

  describe('buildHeaders', () => {
    it('should build correct headers', () => {
      const headers = (service as any).buildHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mockApiKey}`,
        'X-API-Version': '1.0',
        'User-Agent': 'WellFlow/1.0',
      });
    });
  });
});
