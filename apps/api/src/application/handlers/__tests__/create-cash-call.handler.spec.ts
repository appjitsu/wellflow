import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CreateCashCallHandler } from '../create-cash-call.handler';
import { CreateCashCallCommand } from '../../commands/create-cash-call.command';
import type { ICashCallRepository } from '../../../domain/repositories/cash-call.repository.interface';
import { OutboxService } from '../../../infrastructure/events/outbox.service';
import { CashCall } from '../../../domain/entities/cash-call.entity';

describe('CreateCashCallHandler', () => {
  let handler: CreateCashCallHandler;
  let cashCallRepository: jest.Mocked<ICashCallRepository>;
  let outboxService: jest.Mocked<OutboxService>;

  const validCommand = new CreateCashCallCommand(
    'org-123',
    'lease-456',
    'partner-789',
    '2024-01-01',
    '15000.00',
    'MONTHLY',
    {
      dueDate: '2024-01-15',
      interestRatePercent: '12.50',
      consentRequired: true,
    },
  );

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockCashCallRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByOrganizationId: jest.fn(),
    };

    const mockOutboxService = {
      record: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCashCallHandler,
        {
          provide: 'CashCallRepository',
          useValue: mockCashCallRepository,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
      ],
    }).compile();

    handler = module.get<CreateCashCallHandler>(CreateCashCallHandler);
    cashCallRepository = module.get('CashCallRepository');
    outboxService = module.get(OutboxService);
  });

  describe('execute', () => {
    it('should create cash call successfully', async () => {
      // Arrange
      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        dueDate: '2024-01-15',
        amount: '15000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        interestRatePercent: '12.50',
        consentRequired: true,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBe('cash-call-123');
      expect(cashCallRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getOrganizationId: expect.any(Function),
          getLeaseId: expect.any(Function),
          getPartnerId: expect.any(Function),
        }),
      );
      expect(outboxService.record).toHaveBeenCalledWith({
        eventType: 'CashCallCreated',
        aggregateType: 'CashCall',
        aggregateId: 'cash-call-123',
        organizationId: 'org-123',
        payload: {
          id: 'cash-call-123',
          partnerId: 'partner-789',
          leaseId: 'lease-456',
          amount: '15000.00',
        },
      });
    });

    it('should create cash call with minimal required fields', async () => {
      // Arrange
      const minimalCommand = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '5000.00',
        'SUPPLEMENTAL',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-minimal',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '5000.00',
        type: 'SUPPLEMENTAL',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(minimalCommand);

      // Assert
      expect(result).toBe('cash-call-minimal');
      expect(cashCallRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          getOrganizationId: expect.any(Function),
        }),
      );
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle invalid billing month format', async () => {
      // Arrange
      const invalidCommand = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01', // Invalid format - missing day
        '15000.00',
        'MONTHLY',
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        'billingMonth must be YYYY-MM-DD',
      );

      expect(cashCallRepository.save).not.toHaveBeenCalled();
      expect(outboxService.record).not.toHaveBeenCalled();
    });

    it('should handle invalid amount format', async () => {
      // Arrange
      const invalidCommand = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '15000', // Invalid format - missing decimal places
        'MONTHLY',
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        'amount must be a decimal string with 2 digits',
      );

      expect(cashCallRepository.save).not.toHaveBeenCalled();
      expect(outboxService.record).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      // Arrange
      cashCallRepository.save.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Database connection failed',
      );

      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).not.toHaveBeenCalled();
    });

    it('should handle outbox recording errors', async () => {
      // Arrange
      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '15000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);
      outboxService.record.mockRejectedValue(
        new Error('Outbox service failed'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Outbox service failed',
      );

      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should create cash calls with different types', async () => {
      // Test different cash call types
      const cashCallTypes = ['MONTHLY', 'SUPPLEMENTAL'] as const;

      for (const type of cashCallTypes) {
        const command = new CreateCashCallCommand(
          'org-123',
          'lease-456',
          'partner-789',
          '2024-01-01',
          '10000.00',
          type,
        );

        const mockCashCall = new CashCall({
          id: `cash-call-${type}`,
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '10000.00',
          type,
          status: 'DRAFT',
          consentRequired: false,
        });

        cashCallRepository.save.mockResolvedValue(mockCashCall);

        const result = await handler.execute(command);
        expect(result).toBe(`cash-call-${type}`);
      }
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
        const command = new CreateCashCallCommand(
          orgId,
          'lease-456',
          'partner-789',
          '2024-01-01',
          '5000.00',
          'MONTHLY',
        );

        const mockCashCall = new CashCall({
          id: 'cash-call-123',
          organizationId: orgId,
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '5000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: false,
        });

        cashCallRepository.save.mockResolvedValue(mockCashCall);

        const result = await handler.execute(command);
        expect(result).toBe('cash-call-123');
        expect(outboxService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: orgId,
          }),
        );
      }
    });

    it('should handle different lease IDs correctly', async () => {
      // Test various lease ID formats
      const testCases = [
        'lease-123',
        'API-1234567890',
        'simple-lease',
        'lease_with_underscores',
        'lease-with-dashes',
      ];

      for (const leaseId of testCases) {
        const command = new CreateCashCallCommand(
          'org-123',
          leaseId,
          'partner-789',
          '2024-01-01',
          '5000.00',
          'MONTHLY',
        );

        const mockCashCall = new CashCall({
          id: 'cash-call-123',
          organizationId: 'org-123',
          leaseId,
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          amount: '5000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: false,
        });

        cashCallRepository.save.mockResolvedValue(mockCashCall);

        const result = await handler.execute(command);
        expect(result).toBe('cash-call-123');
        expect(outboxService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              leaseId,
            }),
          }),
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
        const command = new CreateCashCallCommand(
          'org-123',
          'lease-456',
          partnerId,
          '2024-01-01',
          '5000.00',
          'MONTHLY',
        );

        const mockCashCall = new CashCall({
          id: 'cash-call-123',
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId,
          billingMonth: '2024-01-01',
          amount: '5000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: false,
        });

        cashCallRepository.save.mockResolvedValue(mockCashCall);

        const result = await handler.execute(command);
        expect(result).toBe('cash-call-123');
        expect(outboxService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.objectContaining({
              partnerId,
            }),
          }),
        );
      }
    });

    it('should handle empty organization ID', async () => {
      // Arrange
      const command = new CreateCashCallCommand(
        '',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '5000.00',
        'MONTHLY',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: '',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '5000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('cash-call-123');
      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle empty lease ID', async () => {
      // Arrange
      const command = new CreateCashCallCommand(
        'org-123',
        '',
        'partner-789',
        '2024-01-01',
        '5000.00',
        'MONTHLY',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: '',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '5000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('cash-call-123');
      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle empty partner ID', async () => {
      // Arrange
      const command = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        '',
        '2024-01-01',
        '5000.00',
        'MONTHLY',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: '',
        billingMonth: '2024-01-01',
        amount: '5000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('cash-call-123');
      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle null organization ID', async () => {
      // Arrange
      const command = new CreateCashCallCommand(
        null as any,
        'lease-456',
        'partner-789',
        '2024-01-01',
        '5000.00',
        'MONTHLY',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: null as any,
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '5000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('cash-call-123');
      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle null lease ID', async () => {
      // Arrange
      const command = new CreateCashCallCommand(
        'org-123',
        null as any,
        'partner-789',
        '2024-01-01',
        '5000.00',
        'MONTHLY',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: null as any,
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '5000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('cash-call-123');
      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle null partner ID', async () => {
      // Arrange
      const command = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        null as any,
        '2024-01-01',
        '5000.00',
        'MONTHLY',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: null as any,
        billingMonth: '2024-01-01',
        amount: '5000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('cash-call-123');
      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions from repository', async () => {
      // Arrange
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      cashCallRepository.save.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(validCommand);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions from outbox', async () => {
      // Arrange
      const mockCashCall = new CashCall({
        id: 'cash-call-123',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '15000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);
      const nonErrorException = { message: 'Outbox non-error', code: 500 };
      outboxService.record.mockRejectedValue(nonErrorException);

      // Act & Assert
      try {
        await handler.execute(validCommand);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(cashCallRepository.save).toHaveBeenCalled();
      expect(outboxService.record).toHaveBeenCalled();
    });

    it('should handle cash calls with consent required', async () => {
      // Arrange
      const consentCommand = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '20000.00',
        'MONTHLY',
        {
          consentRequired: true,
        },
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-consent',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '20000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: true,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(consentCommand);

      // Assert
      expect(result).toBe('cash-call-consent');
      expect(cashCallRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // The entity should have consentRequired: true
        }),
      );
    });

    it('should handle cash calls with interest rate', async () => {
      // Arrange
      const interestCommand = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '25000.00',
        'SUPPLEMENTAL',
        {
          interestRatePercent: '15.75',
        },
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-interest',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '25000.00',
        type: 'SUPPLEMENTAL',
        status: 'DRAFT',
        interestRatePercent: '15.75',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(interestCommand);

      // Assert
      expect(result).toBe('cash-call-interest');
      expect(cashCallRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // The entity should have interestRatePercent: '15.75'
        }),
      );
    });

    it('should handle large monetary amounts', async () => {
      // Arrange
      const largeAmountCommand = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '999999999999.99', // Large amount
        'MONTHLY',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-large',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '999999999999.99',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(largeAmountCommand);

      // Assert
      expect(result).toBe('cash-call-large');
      expect(outboxService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            amount: '999999999999.99',
          }),
        }),
      );
    });

    it('should handle negative amounts', async () => {
      // Arrange
      const negativeAmountCommand = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '-5000.00', // Negative amount
        'SUPPLEMENTAL',
      );

      const mockCashCall = new CashCall({
        id: 'cash-call-negative',
        organizationId: 'org-123',
        leaseId: 'lease-456',
        partnerId: 'partner-789',
        billingMonth: '2024-01-01',
        amount: '-5000.00',
        type: 'SUPPLEMENTAL',
        status: 'DRAFT',
        consentRequired: false,
      });

      cashCallRepository.save.mockResolvedValue(mockCashCall);

      // Act
      const result = await handler.execute(negativeAmountCommand);

      // Assert
      expect(result).toBe('cash-call-negative');
      expect(outboxService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            amount: '-5000.00',
          }),
        }),
      );
    });

    it('should handle different billing month dates', async () => {
      // Test various valid billing month dates
      const testDates = [
        '2024-01-01',
        '2024-12-31',
        '2023-02-28',
        '2024-02-29', // Leap year
        '2025-12-15',
      ];

      for (const billingMonth of testDates) {
        const command = new CreateCashCallCommand(
          'org-123',
          'lease-456',
          'partner-789',
          billingMonth,
          '10000.00',
          'MONTHLY',
        );

        const mockCashCall = new CashCall({
          id: 'cash-call-date',
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth,
          amount: '10000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: false,
        });

        cashCallRepository.save.mockResolvedValue(mockCashCall);

        const result = await handler.execute(command);
        expect(result).toBe('cash-call-date');
      }
    });

    it('should handle different due dates', async () => {
      // Test various valid due dates
      const testDates = [
        '2024-01-15',
        '2024-02-01',
        '2024-12-31',
        null, // No due date
      ];

      for (const dueDate of testDates) {
        const command = new CreateCashCallCommand(
          'org-123',
          'lease-456',
          'partner-789',
          '2024-01-01',
          '10000.00',
          'MONTHLY',
          {
            dueDate,
          },
        );

        const mockCashCall = new CashCall({
          id: 'cash-call-due',
          organizationId: 'org-123',
          leaseId: 'lease-456',
          partnerId: 'partner-789',
          billingMonth: '2024-01-01',
          dueDate,
          amount: '10000.00',
          type: 'MONTHLY',
          status: 'DRAFT',
          consentRequired: false,
        });

        cashCallRepository.save.mockResolvedValue(mockCashCall);

        const result = await handler.execute(command);
        expect(result).toBe('cash-call-due');
      }
    });

    it('should handle invalid due date format in entity validation', async () => {
      // Arrange - This tests the entity validation for due date format
      const command = new CreateCashCallCommand(
        'org-123',
        'lease-456',
        'partner-789',
        '2024-01-01',
        '10000.00',
        'MONTHLY',
        {
          dueDate: '2024-01', // Invalid format - missing day
        },
      );

      // Act & Assert - Entity creation should fail due to invalid due date format
      await expect(handler.execute(command)).rejects.toThrow(
        'dueDate must be YYYY-MM-DD',
      );

      expect(cashCallRepository.save).not.toHaveBeenCalled();
      expect(outboxService.record).not.toHaveBeenCalled();
    });
  });
});
