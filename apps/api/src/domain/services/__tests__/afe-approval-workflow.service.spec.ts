import { Test, TestingModule } from '@nestjs/testing';
import {
  AfeApprovalWorkflowService,
  AfeApproval,
  PartnerApprovalRequirement,
} from '../afe-approval-workflow.service';
import { Afe } from '../../entities/afe.entity';
import { AfeApprovalStatus } from '../../enums/afe-status.enum';
import { Money } from '../../value-objects/money';

describe('AfeApprovalWorkflowService', () => {
  let service: AfeApprovalWorkflowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AfeApprovalWorkflowService],
    }).compile();

    service = module.get<AfeApprovalWorkflowService>(
      AfeApprovalWorkflowService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requiresPartnerApproval', () => {
    it('should return true for AFE over threshold', () => {
      const mockAfe = {
        getTotalEstimatedCost: jest.fn().mockReturnValue(new Money(60000)),
      } as unknown as Afe;

      expect(service.requiresPartnerApproval(mockAfe)).toBe(true);
    });

    it('should return false for AFE under threshold', () => {
      const mockAfe = {
        getTotalEstimatedCost: jest.fn().mockReturnValue(new Money(40000)),
      } as unknown as Afe;

      expect(service.requiresPartnerApproval(mockAfe)).toBe(false);
    });

    it('should return false for AFE with no cost', () => {
      const mockAfe = {
        getTotalEstimatedCost: jest.fn().mockReturnValue(null),
      } as unknown as Afe;

      expect(service.requiresPartnerApproval(mockAfe)).toBe(false);
    });
  });

  describe('getApprovalRequirements', () => {
    it('should return empty array for AFE not requiring approval', () => {
      const mockAfe = {
        getTotalEstimatedCost: jest.fn().mockReturnValue(new Money(40000)),
      } as unknown as Afe;

      const partners = [{ id: 'p1', name: 'Partner 1', workingInterest: 0.3 }];

      const result = service.getApprovalRequirements(mockAfe, partners);

      expect(result).toEqual([]);
    });

    it('should return requirements for AFE requiring approval', () => {
      const mockAfe = {
        getTotalEstimatedCost: jest.fn().mockReturnValue(new Money(60000)),
      } as unknown as Afe;

      const partners = [
        { id: 'p1', name: 'Partner 1', workingInterest: 0.3 },
        { id: 'p2', name: 'Partner 2', workingInterest: 0.2 },
      ];

      const result = service.getApprovalRequirements(mockAfe, partners);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        partnerId: 'p1',
        partnerName: 'Partner 1',
        workingInterest: 0.3,
        approvalThreshold: 60000,
        isRequired: true,
      });
      expect(result[1]).toEqual({
        partnerId: 'p2',
        partnerName: 'Partner 2',
        workingInterest: 0.2,
        approvalThreshold: 60000,
        isRequired: false,
      });
    });
  });

  describe('evaluateApprovalWorkflow', () => {
    it('should return approved for AFE not requiring approval', () => {
      const mockAfe = {
        getTotalEstimatedCost: jest.fn().mockReturnValue(new Money(40000)),
      } as unknown as Afe;

      const result = service.evaluateApprovalWorkflow(mockAfe, [], []);

      expect(result).toEqual({
        isComplete: true,
        isApproved: true,
        pendingApprovals: [],
        completedApprovals: [],
      });
    });

    it('should evaluate workflow with approvals', () => {
      const mockAfe = {
        getTotalEstimatedCost: jest.fn().mockReturnValue(new Money(60000)),
      } as unknown as Afe;

      const partnerRequirements: PartnerApprovalRequirement[] = [
        {
          partnerId: 'p1',
          partnerName: 'Partner 1',
          workingInterest: 0.6,
          approvalThreshold: 60000,
          isRequired: true,
        },
        {
          partnerId: 'p2',
          partnerName: 'Partner 2',
          workingInterest: 0.4,
          approvalThreshold: 60000,
          isRequired: false,
        },
      ];

      const approvals: AfeApproval[] = [
        {
          id: 'a1',
          afeId: 'afe1',
          partnerId: 'p1',
          approvalStatus: AfeApprovalStatus.APPROVED,
          approvedAmount: new Money(60000),
          approvalDate: new Date(),
          approvedByUserId: 'u1',
        },
      ];

      const result = service.evaluateApprovalWorkflow(
        mockAfe,
        approvals,
        partnerRequirements,
      );

      expect(result.isComplete).toBe(true);
      expect(result.isApproved).toBe(true);
      expect(result.pendingApprovals).toHaveLength(1);
      expect(result.completedApprovals).toHaveLength(1);
    });
  });

  describe('validatePartnerApproval', () => {
    const requirement: PartnerApprovalRequirement = {
      partnerId: 'p1',
      partnerName: 'Partner 1',
      workingInterest: 0.5,
      approvalThreshold: 50000,
      isRequired: true,
    };

    it('should validate correct approval', () => {
      const approval: Partial<AfeApproval> = {
        partnerId: 'p1',
        approvalStatus: AfeApprovalStatus.APPROVED,
        approvedAmount: new Money(40000),
      };

      expect(() =>
        service.validatePartnerApproval(approval, requirement),
      ).not.toThrow();
    });

    it('should throw for invalid partner ID', () => {
      const approval: Partial<AfeApproval> = {
        partnerId: 'p2',
        approvalStatus: AfeApprovalStatus.APPROVED,
      };

      expect(() =>
        service.validatePartnerApproval(approval, requirement),
      ).toThrow('Invalid partner ID for approval');
    });

    it('should throw for missing status', () => {
      const approval: Partial<AfeApproval> = {
        partnerId: 'p1',
      };

      expect(() =>
        service.validatePartnerApproval(approval, requirement),
      ).toThrow('Approval status is required');
    });

    it('should throw for approved amount exceeding threshold', () => {
      const approval: Partial<AfeApproval> = {
        partnerId: 'p1',
        approvalStatus: AfeApprovalStatus.APPROVED,
        approvedAmount: new Money(60000),
      };

      expect(() =>
        service.validatePartnerApproval(approval, requirement),
      ).toThrow(
        'Approved amount cannot exceed the original AFE estimated cost',
      );
    });

    it('should throw for rejected approval without comments', () => {
      const approval: Partial<AfeApproval> = {
        partnerId: 'p1',
        approvalStatus: AfeApprovalStatus.REJECTED,
      };

      expect(() =>
        service.validatePartnerApproval(approval, requirement),
      ).toThrow('Rejection reason is required');
    });
  });

  describe('canPartnerApprove', () => {
    it('should return true for partner in requirements', () => {
      const requirements: PartnerApprovalRequirement[] = [
        {
          partnerId: 'p1',
          partnerName: 'Partner 1',
          workingInterest: 0.5,
          approvalThreshold: 50000,
          isRequired: true,
        },
      ];

      expect(service.canPartnerApprove('p1', requirements)).toBe(true);
    });

    it('should return false for partner not in requirements', () => {
      const requirements: PartnerApprovalRequirement[] = [
        {
          partnerId: 'p1',
          partnerName: 'Partner 1',
          workingInterest: 0.5,
          approvalThreshold: 50000,
          isRequired: true,
        },
      ];

      expect(service.canPartnerApprove('p2', requirements)).toBe(false);
    });
  });

  describe('getApprovalDeadline', () => {
    it('should return deadline 30 days from creation', () => {
      const createdAt = new Date('2024-01-01');
      const mockAfe = {
        getCreatedAt: jest.fn().mockReturnValue(createdAt),
      } as unknown as Afe;

      const deadline = service.getApprovalDeadline(mockAfe);

      expect(deadline.getTime()).toBe(new Date('2024-01-31').getTime());
    });
  });

  describe('isApprovalOverdue', () => {
    it('should return true if past deadline', () => {
      const createdAt = new Date('2024-01-01');
      const mockAfe = {
        getCreatedAt: jest.fn().mockReturnValue(createdAt),
      } as unknown as Afe;

      jest.useFakeTimers().setSystemTime(new Date('2024-02-01'));

      expect(service.isApprovalOverdue(mockAfe)).toBe(true);

      jest.useRealTimers();
    });

    it('should return false if before deadline', () => {
      const createdAt = new Date('2024-01-01');
      const mockAfe = {
        getCreatedAt: jest.fn().mockReturnValue(createdAt),
      } as unknown as Afe;

      jest.useFakeTimers().setSystemTime(new Date('2024-01-15'));

      expect(service.isApprovalOverdue(mockAfe)).toBe(false);

      jest.useRealTimers();
    });
  });
});
