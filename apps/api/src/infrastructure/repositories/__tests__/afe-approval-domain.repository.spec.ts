import { Test, TestingModule } from '@nestjs/testing';
import { AfeApprovalDomainRepository } from '../afe-approval-domain.repository';
import { AfeApproval } from '../../../domain/entities/afe-approval.entity';
import { AfeApprovalStatus } from '../../../domain/enums/afe-status.enum';
import { Money } from '../../../domain/value-objects/money';

// Mock the database schema
jest.mock('../../../database/schemas/afe-approvals', () => ({
  afeApprovals: {
    id: 'id',
    afeId: 'afeId',
    partnerId: 'partnerId',
    approvalStatus: 'approvalStatus',
    approvedAmount: 'approvedAmount',
    approvalDate: 'approvalDate',
    comments: 'comments',
    approvedByUserId: 'approvedByUserId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((field, value) => ({ field, value })),
  and: jest.fn((...conditions) => ({ conditions })),
  desc: jest.fn((field) => ({ field, desc: true })),
  count: jest.fn(() => ({ count: true })),
}));

describe('AfeApprovalDomainRepository', () => {
  let repository: AfeApprovalDomainRepository;
  let mockDb: any;

  const mockApprovalData = {
    id: 'approval-123',
    afeId: 'afe-456',
    partnerId: 'partner-789',
    approvalStatus: AfeApprovalStatus.PENDING,
    approvedAmount: null,
    approvalDate: null,
    comments: null,
    approvedByUserId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    // Create mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AfeApprovalDomainRepository,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<AfeApprovalDomainRepository>(
      AfeApprovalDomainRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should create new approval when it does not exist', async () => {
      const approval = new AfeApproval(
        'approval-123',
        'afe-456',
        'partner-789',
        AfeApprovalStatus.PENDING,
      );

      // Mock database responses
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No existing approval
          }),
        }),
      });

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockApprovalData]),
        }),
      });

      const result = await repository.save(approval);

      expect(result).toBeInstanceOf(AfeApproval);
      expect(result.getId()).toBe('approval-123');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should update existing approval when it exists', async () => {
      const approval = new AfeApproval(
        'approval-123',
        'afe-456',
        'partner-789',
        AfeApprovalStatus.APPROVED,
        {
          approvedAmount: new Money(50000, 'USD'),
          comments: 'Approved',
        },
      );

      // Mock database responses
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockApprovalData]), // Existing approval
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                ...mockApprovalData,
                approvalStatus: AfeApprovalStatus.APPROVED,
                approvedAmount: '50000.00 USD',
                comments: 'Approved',
              },
            ]),
          }),
        }),
      });

      const result = await repository.save(approval);

      expect(result).toBeInstanceOf(AfeApproval);
      expect(result.getApprovalStatus()).toBe(AfeApprovalStatus.APPROVED);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      const approval = new AfeApproval(
        'approval-123',
        'afe-456',
        'partner-789',
        AfeApprovalStatus.APPROVED,
      );

      // Mock database responses
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockApprovalData]), // Existing approval
          }),
        }),
      });

      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]), // Update failed
          }),
        }),
      });

      await expect(repository.save(approval)).rejects.toThrow(
        'Failed to update AFE approval',
      );
    });
  });

  describe('findById', () => {
    it('should return approval when found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockApprovalData]),
          }),
        }),
      });

      const result = await repository.findById('approval-123');

      expect(result).toBeInstanceOf(AfeApproval);
      expect(result?.getId()).toBe('approval-123');
    });

    it('should return null when not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByAfeAndPartner', () => {
    it('should return approval when found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockApprovalData]),
          }),
        }),
      });

      const result = await repository.findByAfeAndPartner(
        'afe-456',
        'partner-789',
      );

      expect(result).toBeInstanceOf(AfeApproval);
      expect(result?.getAfeId()).toBe('afe-456');
      expect(result?.getPartnerId()).toBe('partner-789');
    });

    it('should return null when not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findByAfeAndPartner(
        'afe-456',
        'partner-789',
      );

      expect(result).toBeNull();
    });
  });

  describe('findByAfeId', () => {
    it('should return array of approvals', async () => {
      const mockData = [
        mockApprovalData,
        {
          ...mockApprovalData,
          id: 'approval-124',
          partnerId: 'partner-790',
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockData),
          }),
        }),
      });

      const result = await repository.findByAfeId('afe-456');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(AfeApproval);
      expect(result[1]).toBeInstanceOf(AfeApproval);
    });

    it('should return empty array when no approvals found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findByAfeId('afe-456');

      expect(result).toEqual([]);
    });
  });

  describe('findByPartnerId', () => {
    it('should return approvals for partner', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockApprovalData]),
          }),
        }),
      });

      const result = await repository.findByPartnerId('partner-789');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(AfeApproval);
    });
  });

  describe('findByStatus', () => {
    it('should return approvals by status', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockApprovalData]),
          }),
        }),
      });

      const result = await repository.findByStatus(AfeApprovalStatus.PENDING);

      expect(result).toHaveLength(1);
      const approval = result[0]!;
      expect(approval.getApprovalStatus()).toBe(AfeApprovalStatus.PENDING);
    });
  });

  describe('findPendingByPartnerId', () => {
    it('should return pending approvals for partner', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([mockApprovalData]),
          }),
        }),
      });

      const result = await repository.findPendingByPartnerId('partner-789');

      expect(result).toHaveLength(1);
      const approval = result[0]!;
      expect(approval.isPending()).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete approval by id', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(repository.delete('approval-123')).resolves.toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('deleteByAfeId', () => {
    it('should delete all approvals for AFE', async () => {
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(
        repository.deleteByAfeId('afe-456'),
      ).resolves.toBeUndefined();
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should count approvals with criteria', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 5 }]),
        }),
      });

      const result = await repository.count({
        afeId: 'afe-456',
        status: AfeApprovalStatus.PENDING,
      });

      expect(result).toBe(5);
    });

    it('should count all approvals when no criteria', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 10 }]),
        }),
      });

      const result = await repository.count();

      expect(result).toBe(10);
    });
  });

  describe('existsByAfeAndPartner', () => {
    it('should return true when approval exists', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockApprovalData]),
          }),
        }),
      });

      const result = await repository.existsByAfeAndPartner(
        'afe-456',
        'partner-789',
      );

      expect(result).toBe(true);
    });

    it('should return false when approval does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.existsByAfeAndPartner(
        'afe-456',
        'partner-789',
      );

      expect(result).toBe(false);
    });
  });

  describe('getApprovalStats', () => {
    it('should return approval statistics', async () => {
      const mockApprovals = [
        { ...mockApprovalData, approvalStatus: AfeApprovalStatus.PENDING },
        {
          ...mockApprovalData,
          id: 'approval-124',
          approvalStatus: AfeApprovalStatus.APPROVED,
        },
        {
          ...mockApprovalData,
          id: 'approval-125',
          approvalStatus: AfeApprovalStatus.REJECTED,
          comments: 'Not approved',
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockApprovals),
          }),
        }),
      });

      const result = await repository.getApprovalStats('afe-456');

      expect(result).toEqual({
        total: 3,
        pending: 1,
        approved: 1,
        rejected: 1,
        conditional: 0,
      });
    });
  });

  describe('areAllApprovalsComplete', () => {
    it('should return true when no pending approvals', async () => {
      const mockApprovals = [
        { ...mockApprovalData, approvalStatus: AfeApprovalStatus.APPROVED },
        {
          ...mockApprovalData,
          id: 'approval-124',
          approvalStatus: AfeApprovalStatus.REJECTED,
          comments: 'Not approved',
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockApprovals),
          }),
        }),
      });

      const result = await repository.areAllApprovalsComplete('afe-456');

      expect(result).toBe(true);
    });

    it('should return false when there are pending approvals', async () => {
      const mockApprovals = [
        { ...mockApprovalData, approvalStatus: AfeApprovalStatus.PENDING },
        {
          ...mockApprovalData,
          id: 'approval-124',
          approvalStatus: AfeApprovalStatus.APPROVED,
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue(mockApprovals),
          }),
        }),
      });

      const result = await repository.areAllApprovalsComplete('afe-456');

      expect(result).toBe(false);
    });
  });

  // eslint-disable-next-line no-secrets/no-secrets
  describe('hasSufficientApprovals', () => {
    it('should return true when approved > rejected', async () => {
      const mockApprovals = [
        { ...mockApprovalData, approvalStatus: AfeApprovalStatus.APPROVED },
        {
          ...mockApprovalData,
          id: 'approval-124',
          approvalStatus: AfeApprovalStatus.APPROVED,
        },
        {
          ...mockApprovalData,
          id: 'approval-125',
          approvalStatus: AfeApprovalStatus.REJECTED,
          comments: 'Not approved',
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockApprovals),
          }),
        }),
      });

      const result = await repository.hasSufficientApprovals('afe-456');

      expect(result).toBe(true);
    });

    it('should return false when approved <= rejected', async () => {
      const mockApprovals = [
        { ...mockApprovalData, approvalStatus: AfeApprovalStatus.APPROVED },
        {
          ...mockApprovalData,
          id: 'approval-124',
          approvalStatus: AfeApprovalStatus.REJECTED,
          comments: 'Not approved',
        },
        {
          ...mockApprovalData,
          id: 'approval-125',
          approvalStatus: AfeApprovalStatus.REJECTED,
          comments: 'Rejected for budget reasons',
        },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockApprovals),
          }),
        }),
      });

      const result = await repository.hasSufficientApprovals('afe-456');

      expect(result).toBe(false);
    });
  });
});
