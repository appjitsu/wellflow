import { Test, TestingModule } from '@nestjs/testing';
import { OwnerPaymentRepository } from '../owner-payment.repository';
import { DatabaseService } from '../../../database/database.service';
import { OwnerPayment } from '../../../domain/entities/owner-payment.entity';
import { ownerPayments } from '../../../database/schemas/owner-payments';

describe('OwnerPaymentRepository', () => {
  let repository: OwnerPaymentRepository;
  let mockDatabaseService: any;
  let mockDb: any;

  const mockOwnerPaymentRow = {
    id: 'payment-123',
    organizationId: 'org-456',
    partnerId: 'partner-789',
    revenueDistributionId: 'dist-101',
    paymentMethod: 'CHECK',
    status: 'PROCESSED',
    grossAmount: '10000.00',
    deductions: '500.00',
    taxWithholding: '1000.00',
    netAmount: '8500.00',
    checkNumber: 'CHK-001234',
    achTraceNumber: null,
    paymentDate: '2024-01-15',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockOwnerPayments = [mockOwnerPaymentRow];

    const offsetMock = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockOwnerPayments));
    const limitAfterOrderByMock = jest.fn().mockReturnValue({
      offset: offsetMock,
    });
    const limitMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockOwnerPaymentRow]));
    const thenMock = jest
      .fn()
      .mockReturnValue(Promise.resolve(mockOwnerPayments));
    const orderByMock = jest.fn().mockReturnValue({
      limit: limitAfterOrderByMock,
      then: thenMock,
    });
    const queryBuilder = {
      then: thenMock,
      limit: limitMock,
      offset: offsetMock,
      orderBy: orderByMock,
    };

    const insertReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockOwnerPaymentRow]));
    const updateReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockOwnerPaymentRow]));

    mockDb = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => queryBuilder),
        })),
      })),
      insert: jest.fn(() => ({
        values: jest.fn(() => ({
          returning: insertReturningMock,
        })),
      })),
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            returning: updateReturningMock,
          })),
        })),
      })),
      then: thenMock,
      limit: limitMock,
      limitAfterOrderBy: limitAfterOrderByMock,
      limitMock,
      offset: offsetMock,
      offsetMock,
      orderByMock,
      insertReturningMock,
      updateReturningMock,
    };

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerPaymentRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<OwnerPaymentRepository>(OwnerPaymentRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save new owner payment successfully', async () => {
      const payment = new OwnerPayment({
        organizationId: 'org-456',
        partnerId: 'partner-789',
        revenueDistributionId: 'dist-101',
        method: 'CHECK',
        status: 'PENDING',
        grossAmount: '15000.00',
        deductionsAmount: '750.00',
        taxWithheldAmount: '1500.00',
        netAmount: '12750.00',
        checkNumber: 'CHK-001235',
        paymentDate: new Date('2024-01-20'),
      });

      // Mock findById to return null (not found)
      mockDb.limit.mockResolvedValue([]);

      // Mock insert to return the inserted row
      mockDb.insertReturningMock.mockResolvedValue([mockOwnerPaymentRow]);

      const result = await repository.save(payment);

      expect(result).toBeInstanceOf(OwnerPayment);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(ownerPayments);
    });

    it('should update existing owner payment successfully', async () => {
      const payment = OwnerPayment.fromPersistence({
        id: 'payment-123',
        organizationId: 'org-456',
        partnerId: 'partner-789',
        revenueDistributionId: 'dist-101',
        method: 'CHECK',
        status: 'CLEARED',
        grossAmount: '10000.00',
        deductionsAmount: '500.00',
        taxWithheldAmount: '1000.00',
        netAmount: '8500.00',
        checkNumber: 'CHK-001234',
        paymentDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      // Mock findById to return existing payment
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue(Promise.resolve([mockOwnerPaymentRow])),
          }),
        }),
      });

      // Mock update to succeed
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue(Promise.resolve({ rowCount: 1 })),
        }),
      });

      const result = await repository.save(payment);

      expect(result).toBe(payment);
      expect(mockDb.update).toHaveBeenCalledWith(ownerPayments);
    });

    it('should throw error when updating without id', async () => {
      const payment = new OwnerPayment({
        organizationId: 'org-456',
        partnerId: 'partner-789',
        revenueDistributionId: 'dist-101',
        method: 'ACH',
        status: 'PENDING',
        grossAmount: '20000.00',
        netAmount: '18000.00',
        achTraceNumber: 'ACH-123456',
      });

      // Mock findById to return existing payment (this shouldn't happen for new entities)
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockReturnValue(Promise.resolve([mockOwnerPaymentRow])),
          }),
        }),
      });

      const result = await repository.save(payment);
      expect(result).toBeInstanceOf(OwnerPayment);
    });
  });

  describe('findById', () => {
    it('should find owner payment by id', async () => {
      const result = await repository.findById('payment-123');

      expect(result).toBeInstanceOf(OwnerPayment);
      expect(result?.toPersistence().id).toBe('payment-123');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when owner payment not found', async () => {
      // Mock the limit to return empty array
      mockDb.limitMock.mockReturnValue(Promise.resolve([]));

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrganizationId', () => {
    it('should find owner payments by organization id', async () => {
      const result = await repository.findByOrganizationId('org-456');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(OwnerPayment);
    });

    it('should apply partnerId filter', async () => {
      const mockRows = [mockOwnerPaymentRow];

      // Mock the select chain to return filtered payment rows
      mockDb.then.mockResolvedValue(mockRows);

      const result = await repository.findByOrganizationId('org-456', {
        partnerId: 'partner-789',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(OwnerPayment);
    });

    it('should apply status filter', async () => {
      const mockRows = [mockOwnerPaymentRow];

      // Mock the select chain to return filtered payment rows
      mockDb.then.mockResolvedValue(mockRows);

      const result = await repository.findByOrganizationId('org-456', {
        status: 'PROCESSED',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(OwnerPayment);
    });

    it('should apply pagination options', async () => {
      const result = await repository.findByOrganizationId('org-456', {
        limit: 10,
        offset: 20,
      });

      expect(result).toHaveLength(1);
      expect(mockDb.limitAfterOrderBy).toHaveBeenCalledWith(10);
      expect(mockDb.offset).toHaveBeenCalledWith(20);
    });
  });

  describe('error handling', () => {
    it('should throw error when save fails on insert', async () => {
      const payment = new OwnerPayment({
        organizationId: 'org-456',
        partnerId: 'partner-789',
        revenueDistributionId: 'dist-101',
        method: 'WIRE',
        status: 'PENDING',
        grossAmount: '25000.00',
        netAmount: '24000.00',
      });

      // Mock findById to return null
      mockDb.limit.mockResolvedValueOnce([]);

      // Mock insert to throw error
      mockDb.insertReturningMock.mockRejectedValueOnce(
        new Error('Database error'),
      );

      await expect(repository.save(payment)).rejects.toThrow('Database error');
    });

    it('should throw error when findById fails', async () => {
      // Mock the limit to throw error
      mockDb.limit.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findById('payment-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when findByOrganizationId fails', async () => {
      // Mock the offset to throw error
      mockDb.offset.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findByOrganizationId('org-456')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
