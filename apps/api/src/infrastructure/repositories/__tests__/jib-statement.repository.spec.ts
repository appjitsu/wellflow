import { Test, TestingModule } from '@nestjs/testing';
import { JibStatementRepository } from '../jib-statement.repository';
import { DatabaseService } from '../../../database/database.service';
import { JibStatement } from '../../../domain/entities/jib-statement.entity';
import { jibStatements } from '../../../database/schemas/jib-statements';

describe('JibStatementRepository', () => {
  let repository: JibStatementRepository;
  let mockDatabaseService: any;
  let mockDb: any;

  const mockJibStatementRow = {
    id: 'jib-123',
    organizationId: 'org-456',
    leaseId: 'lease-789',
    partnerId: 'partner-101',
    statementPeriodStart: '2024-01-01',
    statementPeriodEnd: '2024-01-31',
    grossRevenue: '50000.00',
    netRevenue: '45000.00',
    workingInterestShare: '0.75',
    royaltyShare: '0.125',
    lineItems: [
      { type: 'revenue', description: 'Oil Sales', amount: '50000.00' },
      { type: 'expense', description: 'Operating Costs', amount: '5000.00' },
    ],
    status: 'draft',
    sentAt: null,
    paidAt: null,
    previousBalance: '0.00',
    currentBalance: '40000.00',
    dueDate: '2024-02-15',
    cashCallId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockJibStatements = [mockJibStatementRow];

    const limitMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockJibStatementRow]));
    const queryBuilder = {
      then: (resolve: any) => Promise.resolve(mockJibStatements).then(resolve),
      limit: limitMock,
    };

    const insertReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockJibStatementRow]));
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
        JibStatementRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<JibStatementRepository>(JibStatementRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find JIB statement by id', async () => {
      const result = await repository.findById('jib-123');

      expect(result).toBeInstanceOf(JibStatement);
      expect(result?.toPersistence().id).toBe('jib-123');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when JIB statement not found', async () => {
      // Mock the limit to return empty array
      mockDb.limitMock.mockReturnValue(Promise.resolve([]));

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new JIB statement successfully', async () => {
      const createInput = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2024-02-01',
        statementPeriodEnd: '2024-02-29',
        dueDate: '2024-03-15',
        grossRevenue: '60000.00',
        netRevenue: '54000.00',
        workingInterestShare: '0.80',
        royaltyShare: '0.133',
        previousBalance: '1000.00',
        currentBalance: '52000.00',
        lineItems: [
          {
            type: 'revenue' as const,
            description: 'Gas Sales',
            amount: '60000.00',
          },
          {
            type: 'expense' as const,
            description: 'Transportation',
            amount: '6000.00',
          },
        ],
        status: 'draft' as const,
      };

      const result = await repository.create(createInput);

      expect(result).toBeInstanceOf(JibStatement);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(jibStatements);
    });

    it('should create JIB statement with minimal data', async () => {
      const createInput = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2024-03-01',
        statementPeriodEnd: '2024-03-31',
        currentBalance: '0.00',
      };

      const result = await repository.create(createInput);

      expect(result).toBeInstanceOf(JibStatement);
    });
  });

  describe('save', () => {
    it('should update existing JIB statement successfully', async () => {
      const statement = new JibStatement({
        id: 'jib-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2024-01-01',
        statementPeriodEnd: '2024-01-31',
        currentBalance: '35000.00',
        cashCallId: 'cash-call-123',
      });

      const result = await repository.save(statement);

      expect(result).toBe(statement);
      expect(mockDb.update).toHaveBeenCalledWith(jibStatements);
    });

    it('should throw error when saving without id', async () => {
      const statement = new JibStatement({
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2024-01-01',
        statementPeriodEnd: '2024-01-31',
        currentBalance: '35000.00',
      });

      await expect(repository.save(statement)).rejects.toThrow(
        'Insert for JibStatement is not supported via repository',
      );
    });
  });

  describe('error handling', () => {
    it('should throw error when findById fails', async () => {
      // Mock the limit to reject
      mockDb.limitMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.findById('jib-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when create fails', async () => {
      const createInput = {
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2024-02-01',
        statementPeriodEnd: '2024-02-29',
        currentBalance: '52000.00',
      };

      // Mock insert returning to reject
      mockDb.insertReturningMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.create(createInput)).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when save fails', async () => {
      const statement = new JibStatement({
        id: 'jib-123',
        organizationId: 'org-456',
        leaseId: 'lease-789',
        partnerId: 'partner-101',
        statementPeriodStart: '2024-01-01',
        statementPeriodEnd: '2024-01-31',
        currentBalance: '35000.00',
      });

      // Mock update where to reject
      mockDb.updateWhereMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.save(statement)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
