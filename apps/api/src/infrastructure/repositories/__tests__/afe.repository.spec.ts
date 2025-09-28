import { Test, TestingModule } from '@nestjs/testing';
import { AfeRepository } from '../afe.repository';
import { DatabaseService } from '../../../database/database.service';

describe('AfeRepository', () => {
  let repository: AfeRepository;
  let mockDb: any;
  let mockDatabaseService: { getDb: jest.Mock };

  beforeEach(async () => {
    // Create comprehensive mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue([]),
    };

    // Mock DatabaseService
    mockDatabaseService = {
      getDb: jest.fn().mockReturnValue(mockDb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AfeRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    repository = module.get<AfeRepository>(AfeRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(repository).toBeDefined();
    });

    it('should be an instance of AfeRepository', () => {
      expect(repository).toBeInstanceOf(AfeRepository);
    });
  });

  describe('findWithDetails', () => {
    it('should find AFE with line items and approvals', async () => {
      const mockAfe = { id: 'afe-1', name: 'Test AFE' };
      const mockLineItems = [{ id: 'line-1', afeId: 'afe-1' }];
      const mockApprovals = [{ id: 'approval-1', afeId: 'afe-1' }];

      // Mock the base repository findById method
      jest.spyOn(repository, 'findById').mockResolvedValue(mockAfe as any);

      // Mock the database queries for line items and approvals
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockResolvedValueOnce(mockLineItems)
            .mockResolvedValueOnce(mockApprovals),
        }),
      });

      const result = await repository.findWithDetails('afe-1');

      expect(result).toEqual({
        afe: mockAfe,
        lineItems: mockLineItems,
        approvals: mockApprovals,
      });
      expect(repository.findById).toHaveBeenCalledWith('afe-1');
    });

    it('should handle null AFE', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findWithDetails('nonexistent-afe');

      expect(result.afe).toBeNull();
      expect(result.lineItems).toEqual([]);
      expect(result.approvals).toEqual([]);
    });
  });

  describe('findByWellId', () => {
    it('should find AFEs by well ID', async () => {
      const mockAfes = [
        { id: 'afe-1', wellId: 'well-1' },
        { id: 'afe-2', wellId: 'well-1' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockAfes as any),
          }),
        }),
      });

      const result = await repository.findByWellId('well-1');

      expect(result).toEqual(mockAfes);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array when no AFEs found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findByWellId('nonexistent-well');

      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('should find AFEs by status', async () => {
      const mockAfes = [
        { id: 'afe-1', status: 'approved', organizationId: 'org-1' },
        { id: 'afe-2', status: 'approved', organizationId: 'org-1' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockAfes as any),
          }),
        }),
      });

      const result = await repository.findByStatus('org-1', 'approved');

      expect(result).toEqual(mockAfes);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle different status values', async () => {
      const statuses = [
        'draft',
        'submitted',
        'approved',
        'rejected',
        'closed',
      ] as const;

      for (const status of statuses) {
        mockDb.select.mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

        const result = await repository.findByStatus('org-1', status);
        expect(result).toEqual([]);
      }
    });
  });

  describe('findByDateRange', () => {
    it('should find AFEs by date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const mockAfes = [{ id: 'afe-1', organizationId: 'org-1' }];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockAfes as any),
          }),
        }),
      });

      const result = await repository.findByDateRange(
        'org-1',
        startDate,
        endDate,
      );

      expect(result).toEqual(mockAfes);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should handle empty date range results', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findByDateRange(
        'org-1',
        startDate,
        endDate,
      );

      expect(result).toEqual([]);
    });
  });

  describe('getTotalCosts', () => {
    it('should calculate total costs', async () => {
      const mockAfe = {
        id: 'afe-1',
        totalEstimatedCost: 100000,
        actualCost: 95000,
      };
      const mockLineItemsSum = [{ total: '85000' }];

      jest.spyOn(repository, 'findById').mockResolvedValue(mockAfe as any);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockLineItemsSum),
        }),
      });

      const result = await repository.getTotalCosts('afe-1');

      expect(result).toEqual({
        estimatedTotal: 100000,
        actualTotal: 95000,
        lineItemsTotal: 85000,
      });
    });

    it('should handle null AFE data', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ total: null }]),
        }),
      });

      const result = await repository.getTotalCosts('nonexistent-afe');

      expect(result).toEqual({
        estimatedTotal: 0,
        actualTotal: 0,
        lineItemsTotal: 0,
      });
    });
  });

  describe('createWithLineItems', () => {
    it('should create AFE with line items', async () => {
      const afeData = { name: 'Test AFE', organizationId: 'org-1' };
      const lineItems = [
        { description: 'Item 1', estimatedCost: 1000 },
        { description: 'Item 2', estimatedCost: 2000 },
      ];
      const mockAfe = { id: 'afe-1', ...afeData };
      const mockLineItems = [
        { id: 'line-1', afeId: 'afe-1', ...lineItems[0] },
        { id: 'line-2', afeId: 'afe-1', ...lineItems[1] },
      ];

      jest.spyOn(repository, 'create').mockResolvedValue(mockAfe as any);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(mockLineItems),
        }),
      });

      const result = await repository.createWithLineItems(
        afeData as any,
        lineItems as any,
      );

      expect(result).toEqual({
        afe: mockAfe,
        lineItems: mockLineItems,
      });
      expect(repository.create).toHaveBeenCalledWith(afeData);
    });

    it('should handle empty line items', async () => {
      const afeData = { name: 'Test AFE', organizationId: 'org-1' };
      const mockAfe = { id: 'afe-1', ...afeData };

      jest.spyOn(repository, 'create').mockResolvedValue(mockAfe as any);
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.createWithLineItems(afeData as any, []);

      expect(result).toEqual({
        afe: mockAfe,
        lineItems: [],
      });
    });
  });

  describe('updateStatus', () => {
    it('should update AFE status', async () => {
      const mockUpdatedAfe = {
        id: 'afe-1',
        status: 'approved',
        updatedAt: expect.any(Date),
      };

      jest.spyOn(repository, 'update').mockResolvedValue(mockUpdatedAfe as any);

      const result = await repository.updateStatus(
        'afe-1',
        'approved',
        'user-1',
      );

      expect(result).toEqual(mockUpdatedAfe);
      expect(repository.update).toHaveBeenCalledWith('afe-1', {
        status: 'approved',
        updatedAt: expect.any(Date),
      });
    });

    it('should handle all status values', async () => {
      const statuses = [
        'draft',
        'submitted',
        'approved',
        'rejected',
        'closed',
      ] as const;

      for (const status of statuses) {
        jest
          .spyOn(repository, 'update')
          .mockResolvedValue({ id: 'afe-1', status } as any);

        const result = await repository.updateStatus('afe-1', status, 'user-1');
        expect(result?.status).toBe(status);
      }
    });
  });

  describe('getApprovalStatus', () => {
    it('should get approval status statistics', async () => {
      const mockApprovals = [
        { id: 'approval-1', approvalStatus: 'pending' },
        { id: 'approval-2', approvalStatus: 'approved' },
        { id: 'approval-3', approvalStatus: 'approved' },
        { id: 'approval-4', approvalStatus: 'rejected' },
      ];

      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(mockApprovals),
        }),
      });

      const result = await repository.getApprovalStatus('afe-1');

      expect(result).toEqual({
        totalApprovals: 4,
        pendingApprovals: 1,
        approvedApprovals: 2,
        rejectedApprovals: 1,
      });
    });

    it('should handle no approvals', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.getApprovalStatus('afe-1');

      expect(result).toEqual({
        totalApprovals: 0,
        pendingApprovals: 0,
        approvedApprovals: 0,
        rejectedApprovals: 0,
      });
    });
  });

  describe('findRequiringApproval', () => {
    it('should find AFEs requiring approval', async () => {
      const mockAfes = [
        { id: 'afe-1', status: 'submitted', organizationId: 'org-1' },
        { id: 'afe-2', status: 'submitted', organizationId: 'org-1' },
      ];

      jest.spyOn(repository, 'findByStatus').mockResolvedValue(mockAfes as any);

      const result = await repository.findRequiringApproval(
        'org-1',
        'partner-1',
      );

      expect(result).toEqual(mockAfes);
      expect(repository.findByStatus).toHaveBeenCalledWith(
        'org-1',
        'submitted',
      );
    });

    it('should return empty array when no AFEs require approval', async () => {
      jest.spyOn(repository, 'findByStatus').mockResolvedValue([]);

      const result = await repository.findRequiringApproval(
        'org-1',
        'partner-1',
      );

      expect(result).toEqual([]);
    });
  });
});
