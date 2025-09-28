import { Test, TestingModule } from '@nestjs/testing';
import { LeaseRepository } from '../lease.repository';
import { DatabaseService } from '../../../database/database.service';
import { leases } from '../../../database/schema';

describe('LeaseRepository', () => {
  let repository: LeaseRepository;
  let mockDatabaseService: any;
  let mockDb: any;

  const mockLeaseData = {
    id: 'lease-123',
    organizationId: 'org-456',
    name: 'Test Lease',
    leaseNumber: 'LEASE001',
    lessor: 'Test Lessor LLC',
    lessee: 'Test Lessee Inc',
    acreage: '640',
    royaltyRate: '12.5%',
    effectiveDate: '2023-01-01',
    expirationDate: '2033-01-01',
    status: 'active',
    legalDescription: 'Section 1, Block 1, County X',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateLeaseDto = {
    name: 'New Test Lease',
    leaseNumber: 'LEASE002',
    lessor: 'New Lessor LLC',
    lessee: 'New Lessee Inc',
    acreage: '320',
    royaltyRate: '15%',
    effectiveDate: '2024-01-01',
    expirationDate: '2034-01-01',
    legalDescription: 'Section 2, Block 2, County Y',
    organizationId: 'org-456',
  };

  beforeEach(async () => {
    const mockLeases = [mockLeaseData, { ...mockLeaseData, id: 'lease-456' }];

    const limitMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockLeaseData]));
    const queryBuilder = {
      then: (resolve: any) => Promise.resolve(mockLeases).then(resolve),
      limit: limitMock,
    };

    const insertReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockLeaseData]));
    const updateReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockLeaseData]));
    const deleteReturningMock = jest
      .fn()
      .mockReturnValue(Promise.resolve([mockLeaseData]));

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
      delete: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: deleteReturningMock,
        })),
      })),
      limitMock,
      insertReturningMock,
      updateReturningMock,
      deleteReturningMock,
    };

    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaseRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<LeaseRepository>(LeaseRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new lease successfully', async () => {
      const result = await repository.create(mockCreateLeaseDto);

      expect(result).toEqual(mockLeaseData);
      expect(mockDatabaseService.getDb).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(leases);
    });
  });

  describe('findById', () => {
    it('should find lease by id', async () => {
      const result = await repository.findById('lease-123');

      expect(result).toEqual(mockLeaseData);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return null when lease not found', async () => {
      // Mock the limit to return empty array
      mockDb.limitMock.mockReturnValue(Promise.resolve([]));

      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all leases for an organization', async () => {
      const result = await repository.findAll('org-456');

      expect(result).toEqual([
        mockLeaseData,
        { ...mockLeaseData, id: 'lease-456' },
      ]);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('findByStatus', () => {
    it('should find leases by status', async () => {
      const result = await repository.findByStatus('org-456', 'active');

      expect(result).toEqual([
        mockLeaseData,
        { ...mockLeaseData, id: 'lease-456' },
      ]);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('findExpiring', () => {
    it('should find expiring leases within specified days', async () => {
      const result = await repository.findExpiring('org-456', 30);

      expect(result).toEqual([
        mockLeaseData,
        { ...mockLeaseData, id: 'lease-456' },
      ]);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update lease successfully', async () => {
      const updateData = { name: 'Updated Lease Name', status: 'inactive' };
      const updatedLease = {
        ...mockLeaseData,
        ...updateData,
        updatedAt: expect.any(Date),
      };

      // Mock the returning to return the updated lease
      mockDb.updateReturningMock.mockReturnValue(
        Promise.resolve([updatedLease]),
      );

      const result = await repository.update('lease-123', updateData);

      expect(result).toEqual(updatedLease);
      expect(mockDb.update).toHaveBeenCalledWith(leases);
    });

    it('should return null when lease not found for update', async () => {
      const updateData = { name: 'Updated Lease Name' };

      // Mock the returning to return empty array
      mockDb.updateReturningMock.mockReturnValue(Promise.resolve([]));

      const result = await repository.update('non-existent-id', updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete lease successfully', async () => {
      const result = await repository.delete('lease-123');

      expect(result).toBe(true);
      expect(mockDb.delete).toHaveBeenCalledWith(leases);
    });

    it('should return false when lease not found for deletion', async () => {
      // Mock the returning to return empty array
      mockDb.deleteReturningMock.mockReturnValue(Promise.resolve([]));

      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when create fails', async () => {
      // Mock the returning to reject
      mockDb.insertReturningMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.create(mockCreateLeaseDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when findById fails', async () => {
      // Mock the limit to reject
      mockDb.limitMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(repository.findById('lease-123')).rejects.toThrow(
        'Database error',
      );
    });

    it('should throw error when update fails', async () => {
      // Mock the returning to reject
      mockDb.updateReturningMock.mockReturnValue(
        Promise.reject(new Error('Database error')),
      );

      await expect(
        repository.update('lease-123', { name: 'New Name' }),
      ).rejects.toThrow('Database error');
    });
  });
});
