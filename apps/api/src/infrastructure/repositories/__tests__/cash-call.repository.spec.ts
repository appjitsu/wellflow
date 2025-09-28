import { Test, TestingModule } from '@nestjs/testing';
import { CashCallRepository } from '../cash-call.repository';
import { DatabaseService } from '../../../database/database.service';
import {
  CashCall,
  CashCallStatus,
  CashCallType,
  CashCallConsentStatus,
} from '../../../domain/entities/cash-call.entity';
import { cashCalls } from '../../../database/schemas/cash-calls';

describe('CashCallRepository', () => {
  let repository: CashCallRepository;
  let mockDatabaseService: any;
  let mockDb: any;

  const mockCashCallRow = {
    id: 'cash-call-123',
    organizationId: 'org-456',
    leaseId: 'lease-789',
    partnerId: 'partner-101',
    billingMonth: '2024-01-01',
    dueDate: '2024-01-15',
    amount: '25000.00',
    type: 'MONTHLY',
    status: 'DRAFT',
    interestRatePercent: '5.00',
    consentRequired: true,
    consentStatus: 'REQUIRED',
    consentReceivedAt: null,
    approvedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockCashCalls = [mockCashCallRow];

    const limitMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockCashCallRow]));
    const queryBuilder = {
      then: (resolve: any) => Promise.resolve(mockCashCalls).then(resolve),
      limit: limitMock,
      offset: jest.fn().mockReturnValue({
        then: (resolve: any) => Promise.resolve(mockCashCalls).then(resolve),
      }),
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockReturnValue(Promise.resolve(mockCashCalls)),
        }),
      }),
    };

    const insertReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockCashCallRow]));
    const updateWhereMock = jest
      .fn()
      .mockReturnValue(Promise.resolve({ rowCount: 1 }));
    const updateMock = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: updateWhereMock,
      }),
    });

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
      update: updateMock,
      limitMock,
      insertReturningMock,
      updateWhereMock,
    };

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashCallRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<CashCallRepository>(CashCallRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save new cash call successfully', async () => {
      const cashCall = new CashCall({
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-02-01',
        dueDate: '2024-02-15',
        amount: '30000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        interestRatePercent: '6.00',
        consentRequired: false,
        consentStatus: 'NOT_REQUIRED',
      });

      // Mock findById to return null (not found)
      mockDb.limitMock.mockReturnValueOnce(Promise.resolve([]));

      const result = await repository.save(cashCall);

      expect(result).toBeInstanceOf(CashCall);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(cashCalls);
    });

    it('should update existing cash call successfully', async () => {
      const cashCall = CashCall.fromPersistence({
        id: 'cash-call-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-01-01',
        dueDate: '2024-01-15',
        amount: '25000.00',
        type: 'MONTHLY',
        status: 'SENT',
        interestRatePercent: '5.00',
        consentRequired: true,
        consentStatus: 'RECEIVED',
        consentReceivedAt: new Date('2024-01-10'),
        approvedAt: new Date('2024-01-12'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      const result = await repository.save(cashCall);

      expect(result).toBe(cashCall);
      expect(mockDb.update).toHaveBeenCalledWith(cashCalls);
    });

    it('should save new cash call when entity has no id', async () => {
      const cashCall = new CashCall({
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-02-01',
        amount: '30000.00',
        type: 'SUPPLEMENTAL',
        status: 'DRAFT',
        consentRequired: false,
      });

      const result = await repository.save(cashCall);

      expect(result).toBeInstanceOf(CashCall);
    });
  });

  describe('findById', () => {
    it('should find cash call by id', async () => {
      const result = await repository.findById('cash-call-123');

      expect(result).toBeInstanceOf(CashCall);
      expect(result?.toPersistence().id).toBe('cash-call-123');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when cash call not found', async () => {
      // Mock the limit to return empty array
      mockDb.limitMock.mockReturnValue(Promise.resolve([]));

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrganizationId', () => {
    it('should find cash calls by organization id', async () => {
      const result = await repository.findByOrganizationId('org-456');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CashCall);
    });

    it('should apply leaseId filter', async () => {
      const result = await repository.findByOrganizationId('org-456', {
        leaseId: 'lease-789',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CashCall);
    });

    it('should apply partnerId filter', async () => {
      const result = await repository.findByOrganizationId('org-456', {
        partnerId: 'partner-101',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CashCall);
    });

    it('should apply status filter', async () => {
      const result = await repository.findByOrganizationId('org-456', {
        status: 'DRAFT',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CashCall);
    });

    it('should apply pagination options', async () => {
      const result = await repository.findByOrganizationId('org-456', {
        limit: 10,
        offset: 20,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should throw error when save fails on insert', async () => {
      const cashCall = new CashCall({
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        billingMonth: '2024-02-01',
        amount: '30000.00',
        type: 'MONTHLY',
        status: 'DRAFT',
        consentRequired: false,
      });

      // Mock findById to return null
      mockDb.limitMock.mockReturnValueOnce(Promise.resolve([]));

      // Mock insert to reject
      mockDb.insertReturningMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.save(cashCall)).rejects.toThrow('Database error');
    });

    it('should throw error when findById fails', async () => {
      // Mock the limit to reject
      mockDb.limitMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.findById('cash-call-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when findByOrganizationId fails', async () => {
      // Mock the then to reject
      const queryBuilder = mockDb.select().from().where();
      // Mock the final offset to reject
      const orderByResult = queryBuilder.orderBy();
      const limitResult = orderByResult.limit();
      limitResult.offset = jest.fn(() =>
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.findByOrganizationId('org-456')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
