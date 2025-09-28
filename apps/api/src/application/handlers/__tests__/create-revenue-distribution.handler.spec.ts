import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateRevenueDistributionHandler } from '../create-revenue-distribution.handler';
import { CreateRevenueDistributionCommand } from '../../commands/create-revenue-distribution.command';
import { IRevenueDistributionRepository } from '../../../domain/repositories/revenue-distribution.repository.interface';
import { RevenueDistribution } from '../../../domain/entities/revenue-distribution.entity';
import { ProductionMonth } from '../../../domain/value-objects/production-month';
import { Money } from '../../../domain/value-objects/money';
import { RevenueDistributionCreatedEvent } from '../../../domain/events/revenue-distribution-created.event';

describe('CreateRevenueDistributionHandler', () => {
  let handler: CreateRevenueDistributionHandler;
  let revenueDistributionRepository: jest.Mocked<IRevenueDistributionRepository>;
  let eventBus: jest.Mocked<EventBus>;

  const validCommand = new CreateRevenueDistributionCommand(
    'org-123',
    'well-456',
    'partner-789',
    'division-order-101',
    '2024-01',
    {
      oilVolume: 1000,
      gasVolume: 5000,
    },
    {
      oilRevenue: 50000,
      gasRevenue: 25000,
      totalRevenue: 80000,
      severanceTax: 8000,
      adValorem: 2000,
      transportationCosts: 3000,
      processingCosts: 1000,
      otherDeductions: 500,
      netRevenue: 55000,
    },
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockRevenueDistributionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrganizationId: jest.fn(),
      findByWellId: jest.fn(),
      findByPartnerId: jest.fn(),
      findByWellPartnerAndMonth: jest.fn(),
      findByDivisionOrderId: jest.fn(),
      findByProductionMonth: jest.fn(),
      findByDateRange: jest.fn(),
      findUnpaid: jest.fn(),
      findPaid: jest.fn(),
      findByCheckNumber: jest.fn(),
      findRequiringPayment: jest.fn(),
      getWellRevenueSummary: jest.fn(),
      getPartnerRevenueSummary: jest.fn(),
      getMonthlyRevenueSummary: jest.fn(),
      getRevenueTrends: jest.fn(),
      findWithCalculationErrors: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      bulkUpdate: jest.fn(),
      getPaymentStatistics: jest.fn(),
      findDuplicates: jest.fn(),
      getAuditHistory: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRevenueDistributionHandler,
        {
          provide: 'RevenueDistributionRepository',
          useValue: mockRevenueDistributionRepository,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateRevenueDistributionHandler>(
      CreateRevenueDistributionHandler,
    );
    revenueDistributionRepository = module.get('RevenueDistributionRepository');
    eventBus = module.get(EventBus);
  });

  describe('execute', () => {
    it('should create revenue distribution successfully', async () => {
      // Arrange
      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalledWith(
        'well-456',
        'partner-789',
        expect.any(ProductionMonth),
      );
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(RevenueDistributionCreatedEvent),
      );
      expect(typeof result).toBe('string');
    });

    it('should throw ConflictException when revenue distribution already exists', async () => {
      // Arrange
      const existingDistribution = {} as RevenueDistribution;
      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        existingDistribution,
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        ConflictException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Revenue distribution already exists for partner partner-789 in well well-456 for 2024-01',
      );

      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      revenueDistributionRepository.findByWellPartnerAndMonth.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to create revenue distribution: Database connection failed',
      );

      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      // Arrange
      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockRejectedValue(
        new Error('Save operation failed'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to create revenue distribution: Save operation failed',
      );

      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should publish domain events after successful creation', async () => {
      // Arrange
      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          revenueDistributionId: expect.any(String),
          organizationId: 'org-123',
          wellId: 'well-456',
          partnerId: 'partner-789',
          productionMonth: '2024-01',
          netRevenue: 55000,
        }),
      );
    });

    it('should handle event publishing errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );
      eventBus.publish.mockImplementation(() => {
        throw new Error('Event bus failed');
      });

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(typeof result).toBe('string');
      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to publish event:',
        expect.any(Error),
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle negative net revenue', async () => {
      // Arrange
      const invalidCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        { oilVolume: 1000 },
        {
          totalRevenue: 10000,
          netRevenue: -5000, // Negative net revenue
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        'Net revenue cannot be negative',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle invalid production month format', async () => {
      // Arrange
      const invalidCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        'invalid-month',
        { oilVolume: 1000 },
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        'Failed to create revenue distribution: Invalid date string format. Expected YYYY-MM',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).not.toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should create revenue distribution with minimal required fields', async () => {
      // Arrange
      const minimalCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      const result = await handler.execute(minimalCommand);

      // Assert
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(typeof result).toBe('string');
    });

    it('should create revenue distribution with all revenue breakdown fields', async () => {
      // Arrange
      const completeCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        {
          oilVolume: 2000,
          gasVolume: 10000,
        },
        {
          oilRevenue: 100000,
          gasRevenue: 50000,
          totalRevenue: 160000,
          severanceTax: 16000,
          adValorem: 4000,
          transportationCosts: 6000,
          processingCosts: 2000,
          otherDeductions: 1000,
          netRevenue: 120000,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      await handler.execute(completeCommand);

      // Assert
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          netRevenue: 120000,
        }),
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
        const command = new CreateRevenueDistributionCommand(
          orgId,
          'well-456',
          'partner-789',
          'division-order-101',
          '2024-01',
          {},
          {
            totalRevenue: 10000,
            netRevenue: 8000,
          },
        );

        revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
          null,
        );
        revenueDistributionRepository.save.mockResolvedValue(
          {} as RevenueDistribution,
        );

        await handler.execute(command);

        expect(
          revenueDistributionRepository.findByWellPartnerAndMonth,
        ).toHaveBeenCalledWith(
          'well-456',
          'partner-789',
          expect.any(ProductionMonth),
        );
      }
    });

    it('should handle different well IDs correctly', async () => {
      // Test various well ID formats
      const testCases = [
        'well-123',
        'API-1234567890',
        'simple-well',
        'well_with_underscores',
        'well-with-dashes',
      ];

      for (const wellId of testCases) {
        const command = new CreateRevenueDistributionCommand(
          'org-123',
          wellId,
          'partner-789',
          'division-order-101',
          '2024-01',
          {},
          {
            totalRevenue: 10000,
            netRevenue: 8000,
          },
        );

        revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
          null,
        );
        revenueDistributionRepository.save.mockResolvedValue(
          {} as RevenueDistribution,
        );

        await handler.execute(command);

        expect(
          revenueDistributionRepository.findByWellPartnerAndMonth,
        ).toHaveBeenCalledWith(
          wellId,
          'partner-789',
          expect.any(ProductionMonth),
        );
      }
    });

    it('should handle different partner IDs correctly', async () => {
      // Test various partner ID formats
      const testCases = [
        'partner-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-partner',
        'partner_with_underscores',
        'partner-with-dashes',
      ];

      for (const partnerId of testCases) {
        const command = new CreateRevenueDistributionCommand(
          'org-123',
          'well-456',
          partnerId,
          'division-order-101',
          '2024-01',
          {},
          {
            totalRevenue: 10000,
            netRevenue: 8000,
          },
        );

        revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
          null,
        );
        revenueDistributionRepository.save.mockResolvedValue(
          {} as RevenueDistribution,
        );

        await handler.execute(command);

        expect(
          revenueDistributionRepository.findByWellPartnerAndMonth,
        ).toHaveBeenCalledWith(
          'well-456',
          partnerId,
          expect.any(ProductionMonth),
        );
      }
    });

    it('should handle empty organization ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        '',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Organization ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle empty well ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        'org-123',
        '',
        'partner-789',
        'division-order-101',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Well ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle empty partner ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        '',
        'division-order-101',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Partner ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle empty division order ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        '',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Division Order ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle null organization ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        null as any,
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Organization ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle null well ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        'org-123',
        null as any,
        'partner-789',
        'division-order-101',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Well ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle null partner ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        null as any,
        'division-order-101',
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Partner ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle null division order ID', async () => {
      // Arrange
      const command = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        null as any,
        '2024-01',
        {},
        {
          totalRevenue: 10000,
          netRevenue: 8000,
        },
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Failed to create revenue distribution: Division Order ID is required',
      );

      expect(
        revenueDistributionRepository.findByWellPartnerAndMonth,
      ).toHaveBeenCalled();
      expect(revenueDistributionRepository.save).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      revenueDistributionRepository.findByWellPartnerAndMonth.mockRejectedValue(
        { message: 'Non-error exception', code: 500 },
      );

      // Act & Assert
      try {
        await handler.execute(validCommand);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).message).toContain(
          'Failed to create revenue distribution',
        );
      }
    });

    it('should handle production volumes with only oil', async () => {
      // Arrange
      const oilOnlyCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        { oilVolume: 1500 },
        {
          oilRevenue: 75000,
          totalRevenue: 75000,
          netRevenue: 60000,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      await handler.execute(oilOnlyCommand);

      // Assert
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle production volumes with only gas', async () => {
      // Arrange
      const gasOnlyCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        { gasVolume: 8000 },
        {
          gasRevenue: 40000,
          totalRevenue: 40000,
          netRevenue: 32000,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      await handler.execute(gasOnlyCommand);

      // Assert
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle zero production volumes', async () => {
      // Arrange
      const zeroVolumeCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        { oilVolume: 0, gasVolume: 0 },
        {
          totalRevenue: 0,
          netRevenue: 0,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      await handler.execute(zeroVolumeCommand);

      // Assert
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle large monetary amounts', async () => {
      // Arrange
      const largeAmountCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        { oilVolume: 10000 },
        {
          oilRevenue: 1000000,
          totalRevenue: 1000000,
          severanceTax: 100000,
          netRevenue: 900000,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      await handler.execute(largeAmountCommand);

      // Assert
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          netRevenue: 900000,
        }),
      );
    });

    it('should handle decimal monetary amounts', async () => {
      // Arrange
      const decimalAmountCommand = new CreateRevenueDistributionCommand(
        'org-123',
        'well-456',
        'partner-789',
        'division-order-101',
        '2024-01',
        { oilVolume: 500 },
        {
          oilRevenue: 25000.5,
          totalRevenue: 25000.5,
          severanceTax: 2500.05,
          netRevenue: 22500.45,
        },
      );

      revenueDistributionRepository.findByWellPartnerAndMonth.mockResolvedValue(
        null,
      );
      revenueDistributionRepository.save.mockResolvedValue(
        {} as RevenueDistribution,
      );

      // Act
      await handler.execute(decimalAmountCommand);

      // Assert
      expect(revenueDistributionRepository.save).toHaveBeenCalledWith(
        expect.any(RevenueDistribution),
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          netRevenue: 22500.45,
        }),
      );
    });
  });
});
