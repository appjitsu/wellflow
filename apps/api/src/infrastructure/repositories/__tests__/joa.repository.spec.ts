import { Test, TestingModule } from '@nestjs/testing';
import { JoaRepository } from '../joa.repository';
import { DatabaseService } from '../../../database/database.service';
import {
  JointOperatingAgreement,
  JoaStatus,
} from '../../../domain/entities/joint-operating-agreement.entity';
import { jointOperatingAgreements } from '../../../database/schemas/joint-operating-agreements';

describe('JoaRepository', () => {
  let repository: JoaRepository;
  let mockDatabaseService: any;
  let mockDb: any;
  let limitMock: any;
  let offsetMock: any;
  let insertReturningMock: any;
  let updateWhereMock: any;

  const mockJoaRow = {
    id: 'joa-123',
    organizationId: 'org-456',
    agreementNumber: 'JOA-2024-001',
    effectiveDate: '2024-01-01',
    endDate: '2029-01-01',
    operatorOverheadPercent: '5.00',
    votingThresholdPercent: '75.00',
    nonConsentPenaltyPercent: '10.00',
    status: 'ACTIVE',
    terms: { confidentiality: true, arbitration: 'AAA' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockJoas = [mockJoaRow];

    limitMock = jest.fn().mockReturnValue(Promise.resolve([mockJoaRow]));
    offsetMock = jest.fn().mockReturnValue(Promise.resolve(mockJoas));
    const queryBuilder = {
      limit: limitMock,
      offset: offsetMock,
      orderBy: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          offset: offsetMock,
        }),
      }),
    };

    insertReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockJoaRow]));
    updateWhereMock = jest
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
      offsetMock,
      insertReturningMock,
      updateWhereMock,
    };

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JoaRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<JoaRepository>(JoaRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save new JOA successfully', async () => {
      const joa = new JointOperatingAgreement({
        organizationId: 'org-456',
        agreementNumber: 'JOA-2024-002',
        effectiveDate: '2024-02-01',
        endDate: '2029-02-01',
        operatorOverheadPercent: '6.00',
        votingThresholdPercent: '80.00',
        nonConsentPenaltyPercent: '12.00',
        status: 'ACTIVE',
        terms: { arbitration: 'ICC' },
      });

      // Mock findById to return null (not found)
      limitMock.mockResolvedValueOnce([]);

      const result = await repository.save(joa);

      expect(result).toBeInstanceOf(JointOperatingAgreement);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(jointOperatingAgreements);
    });

    it('should update existing JOA successfully', async () => {
      const joa = JointOperatingAgreement.fromPersistence({
        id: 'joa-123',
        organizationId: 'org-456',
        agreementNumber: 'JOA-2024-001-UPDATED',
        effectiveDate: '2024-01-01',
        endDate: '2029-01-01',
        operatorOverheadPercent: '5.00',
        votingThresholdPercent: '75.00',
        nonConsentPenaltyPercent: '10.00',
        status: 'ACTIVE',
        terms: { confidentiality: true, arbitration: 'AAA' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });

      // Mock findById to return existing JOA
      limitMock.mockResolvedValueOnce([mockJoaRow]);

      const result = await repository.save(joa);

      expect(result).toBe(joa);
      expect(mockDb.update).toHaveBeenCalledWith(jointOperatingAgreements);
    });
  });

  describe('findById', () => {
    it('should find JOA by id', async () => {
      // Mock the select chain to return the JOA row
      limitMock.mockResolvedValue([mockJoaRow]);

      const result = await repository.findById('joa-123');

      expect(result).toBeInstanceOf(JointOperatingAgreement);
      expect(result?.toPersistence().id).toBe('joa-123');
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when JOA not found', async () => {
      // Mock the select chain to return empty array
      limitMock.mockResolvedValue([]);

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByOrganizationId', () => {
    it('should find JOAs by organization id', async () => {
      const mockRows = [mockJoaRow, { ...mockJoaRow, id: 'joa-456' }];

      // Mock the select chain to return JOA rows
      offsetMock.mockResolvedValue(mockRows);

      const result = await repository.findByOrganizationId('org-456');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(JointOperatingAgreement);
      expect(result[1]).toBeInstanceOf(JointOperatingAgreement);
    });

    it('should apply status filter', async () => {
      const mockRows = [mockJoaRow];

      // Mock the select chain to return filtered JOA rows
      offsetMock.mockResolvedValue(mockRows);

      const result = await repository.findByOrganizationId('org-456', {
        status: 'ACTIVE',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(JointOperatingAgreement);
    });

    it('should apply pagination options', async () => {
      const mockRows = [mockJoaRow];

      // Mock the select chain to return paginated JOA rows
      offsetMock.mockResolvedValue(mockRows);

      const result = await repository.findByOrganizationId('org-456', {
        limit: 10,
        offset: 20,
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('error handling', () => {
    it('should throw error when save fails on insert', async () => {
      const joa = new JointOperatingAgreement({
        organizationId: 'org-456',
        agreementNumber: 'JOA-2024-002',
        effectiveDate: '2024-02-01',
        status: 'ACTIVE',
      });

      // Mock findById to return null
      limitMock.mockResolvedValueOnce([]);

      // Mock insert to throw error
      insertReturningMock.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.save(joa)).rejects.toThrow('Database error');
    });

    it('should throw error when findById fails', async () => {
      // Mock the select chain to throw error
      limitMock.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findById('joa-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when findByOrganizationId fails', async () => {
      // Mock the select chain to throw error
      offsetMock.mockRejectedValueOnce(new Error('Database error'));

      await expect(repository.findByOrganizationId('org-456')).rejects.toThrow(
        'Database error',
      );
    });
  });
});
