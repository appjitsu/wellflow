import { Test, TestingModule } from '@nestjs/testing';
import { GetDailyDrillingReportsByOrganizationHandler } from '../get-daily-drilling-reports-by-organization.handler';
import { GetDailyDrillingReportsByOrganizationQuery } from '../../queries/get-daily-drilling-reports-by-organization.query';
import { DailyDrillingReport } from '../../../domain/entities/daily-drilling-report.entity';
import { IDailyDrillingReportRepository } from '../../../domain/repositories/daily-drilling-report.repository.interface';

describe('GetDailyDrillingReportsByOrganizationHandler', () => {
  let handler: GetDailyDrillingReportsByOrganizationHandler;
  let repository: jest.Mocked<IDailyDrillingReportRepository>;

  const mockReports = [
    new DailyDrillingReport({
      id: 'report-1',
      organizationId: 'org-123',
      wellId: 'well-1',
      reportDate: new Date('2024-01-01'),
      depthMd: 1000,
      rotatingHours: 12,
    }),
    new DailyDrillingReport({
      id: 'report-2',
      organizationId: 'org-123',
      wellId: 'well-2',
      reportDate: new Date('2024-01-02'),
      depthMd: 1200,
      rotatingHours: 14,
    }),
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrganizationId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDailyDrillingReportsByOrganizationHandler,
        {
          provide: 'DailyDrillingReportRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<GetDailyDrillingReportsByOrganizationHandler>(
      GetDailyDrillingReportsByOrganizationHandler,
    );
    repository = module.get('DailyDrillingReportRepository');
  });

  describe('execute', () => {
    it('should return daily drilling reports for organization', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123');
      repository.findByOrganizationId.mockResolvedValue(mockReports);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      expect(result).toEqual([
        {
          id: 'report-1',
          organizationId: 'org-123',
          wellId: 'well-1',
          reportDate: '2024-01-01',
        },
        {
          id: 'report-2',
          organizationId: 'org-123',
          wellId: 'well-2',
          reportDate: '2024-01-02',
        },
      ]);
    });

    it('should return empty array when no reports found', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123');
      repository.findByOrganizationId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      expect(result).toEqual([]);
    });

    it('should handle options with limit and offset', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123', {
        limit: 10,
        offset: 20,
      });
      repository.findByOrganizationId.mockResolvedValue(mockReports);

      // Act
      await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: 10,
        offset: 20,
        wellId: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
    });

    it('should handle options with wellId filter', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123', {
        wellId: 'well-1',
      });
      repository.findByOrganizationId.mockResolvedValue([mockReports[0]!]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: undefined,
        offset: undefined,
        wellId: 'well-1',
        fromDate: undefined,
        toDate: undefined,
      });
      expect(result).toEqual([
        {
          id: 'report-1',
          organizationId: 'org-123',
          wellId: 'well-1',
          reportDate: '2024-01-01',
        },
      ]);
    });

    it('should handle options with date range filters', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123', {
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
      });
      repository.findByOrganizationId.mockResolvedValue(mockReports);

      // Act
      await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
      });
    });

    it('should handle options with all filters combined', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123', {
        limit: 5,
        offset: 10,
        wellId: 'well-1',
        fromDate: '2024-01-01',
        toDate: '2024-01-31',
      });
      repository.findByOrganizationId.mockResolvedValue([mockReports[0]!]);

      // Act
      await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: 5,
        offset: 10,
        wellId: 'well-1',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
      });
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123');
      repository.findByOrganizationId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle different organization IDs correctly', async () => {
      // Test various organization ID formats
      const testCases = [
        'org-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-org',
        'org_with_underscores',
        'org-with-dashes',
      ];

      for (const orgId of testCases) {
        const query = new GetDailyDrillingReportsByOrganizationQuery(orgId);
        repository.findByOrganizationId.mockResolvedValue([]);

        await handler.execute(query);

        expect(repository.findByOrganizationId).toHaveBeenCalledWith(orgId, {
          limit: undefined,
          offset: undefined,
          wellId: undefined,
          fromDate: undefined,
          toDate: undefined,
        });
      }
    });

    it('should handle empty organization ID', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('');
      repository.findByOrganizationId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('', {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      expect(result).toEqual([]);
    });

    it('should handle null organization ID', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery(null as any);
      repository.findByOrganizationId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith(null, {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      expect(result).toEqual([]);
    });

    it('should handle undefined organization ID', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery(
        undefined as any,
      );
      repository.findByOrganizationId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith(undefined, {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: undefined,
        toDate: undefined,
      });
      expect(result).toEqual([]);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123');
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      repository.findByOrganizationId.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }
    });

    it('should format report dates correctly', async () => {
      // Arrange
      const reportWithDifferentDate = new DailyDrillingReport({
        id: 'report-3',
        organizationId: 'org-123',
        wellId: 'well-3',
        reportDate: new Date('2024-12-25T15:30:45.123Z'), // Date with time component
      });

      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123');
      repository.findByOrganizationId.mockResolvedValue([
        reportWithDifferentDate,
      ]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([
        {
          id: 'report-3',
          organizationId: 'org-123',
          wellId: 'well-3',
          reportDate: '2024-12-25', // Should be formatted as YYYY-MM-DD
        },
      ]);
    });

    it('should handle reports with minimal data', async () => {
      // Arrange
      const minimalReport = new DailyDrillingReport({
        id: 'minimal-report',
        organizationId: 'org-123',
        wellId: 'minimal-well',
        reportDate: new Date('2024-01-01'),
      });

      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123');
      repository.findByOrganizationId.mockResolvedValue([minimalReport]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([
        {
          id: 'minimal-report',
          organizationId: 'org-123',
          wellId: 'minimal-well',
          reportDate: '2024-01-01',
        },
      ]);
    });

    it('should handle large result sets', async () => {
      // Arrange
      const largeReports = Array.from(
        { length: 31 },
        (_, i) =>
          new DailyDrillingReport({
            id: `report-${i}`,
            organizationId: 'org-123',
            wellId: `well-${i}`,
            reportDate: new Date(
              `2024-01-${String((i % 31) + 1).padStart(2, '0')}`,
            ),
          }),
      );

      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123');
      repository.findByOrganizationId.mockResolvedValue(largeReports);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toHaveLength(31);
      expect(result[0]).toEqual({
        id: 'report-0',
        organizationId: 'org-123',
        wellId: 'well-0',
        reportDate: '2024-01-01',
      });
      expect(result[30]).toEqual({
        id: 'report-30',
        organizationId: 'org-123',
        wellId: 'well-30',
        reportDate: '2024-01-31',
      });
    });

    it('should handle options with only fromDate', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123', {
        fromDate: '2024-01-01',
      });
      repository.findByOrganizationId.mockResolvedValue(mockReports);

      // Act
      await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: new Date('2024-01-01'),
        toDate: undefined,
      });
    });

    it('should handle options with only toDate', async () => {
      // Arrange
      const query = new GetDailyDrillingReportsByOrganizationQuery('org-123', {
        toDate: '2024-01-31',
      });
      repository.findByOrganizationId.mockResolvedValue(mockReports);

      // Act
      await handler.execute(query);

      // Assert
      expect(repository.findByOrganizationId).toHaveBeenCalledWith('org-123', {
        limit: undefined,
        offset: undefined,
        wellId: undefined,
        fromDate: undefined,
        toDate: new Date('2024-01-31'),
      });
    });
  });
});
