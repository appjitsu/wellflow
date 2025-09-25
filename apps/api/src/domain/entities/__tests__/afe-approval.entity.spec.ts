import { AfeApproval } from '../afe-approval.entity';
import { AfeApprovalStatus } from '../../enums/afe-status.enum';
import { Money } from '../../value-objects/money';

describe('AfeApproval Entity', () => {
  const validId = 'approval-123';
  const validAfeId = 'afe-456';
  const validPartnerId = 'partner-789';
  const validUserId = 'user-101';

  describe('Constructor', () => {
    it('should create approval with required fields', () => {
      const approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.PENDING,
      );

      expect(approval.getId()).toBe(validId);
      expect(approval.getAfeId()).toBe(validAfeId);
      expect(approval.getPartnerId()).toBe(validPartnerId);
      expect(approval.getApprovalStatus()).toBe(AfeApprovalStatus.PENDING);
      expect(approval.getCreatedAt()).toBeInstanceOf(Date);
      expect(approval.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create approval with all optional fields', () => {
      const approvedAmount = new Money(10000, 'USD');
      const approvalDate = new Date('2024-01-15');
      const comments = 'Approved for drilling operations';
      const approvedByUserId = validUserId;

      const approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.APPROVED,
        {
          approvedAmount,
          approvalDate,
          comments,
          approvedByUserId,
        },
      );

      expect(approval.getApprovedAmount()).toBe(approvedAmount);
      expect(approval.getApprovalDate()).toBe(approvalDate);
      expect(approval.getComments()).toBe(comments);
      expect(approval.getApprovedByUserId()).toBe(approvedByUserId);
    });

    it('should throw error for missing AFE ID', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new AfeApproval(validId, '', validPartnerId, AfeApprovalStatus.PENDING);
      }).toThrow('AFE ID is required');
    });

    it('should throw error for missing partner ID', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new AfeApproval(validId, validAfeId, '', AfeApprovalStatus.PENDING);
      }).toThrow('Partner ID is required');
    });

    it('should throw error for invalid approval status', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new AfeApproval(
          validId,
          validAfeId,
          validPartnerId,
          'invalid' as AfeApprovalStatus,
        );
      }).toThrow('Invalid approval status');
    });

    it('should throw error for rejected approval without comments', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new AfeApproval(
          validId,
          validAfeId,
          validPartnerId,
          AfeApprovalStatus.REJECTED,
        );
      }).toThrow('Rejection reason is required');
    });

    it('should throw error for conditional approval without conditions', () => {
      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new AfeApproval(
          validId,
          validAfeId,
          validPartnerId,
          AfeApprovalStatus.CONDITIONAL,
        );
      }).toThrow(
        'Conditional approval requires both conditions and approved amount',
      );
    });

    it('should throw error for negative approved amount', () => {
      const negativeAmount = new Money(-1000, 'USD');

      expect(() => {
        // eslint-disable-next-line sonarjs/constructor-for-side-effects
        new AfeApproval(
          validId,
          validAfeId,
          validPartnerId,
          AfeApprovalStatus.APPROVED,
          { approvedAmount: negativeAmount },
        );
      }).toThrow('Approved amount cannot be negative');
    });
  });

  describe('Business Methods', () => {
    let approval: AfeApproval;

    beforeEach(() => {
      approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.PENDING,
      );
    });

    describe('approve', () => {
      it('should approve with full amount', () => {
        const approvedAmount = new Money(50000, 'USD');
        const comments = 'Approved for full amount';
        const approvedByUserId = validUserId;

        approval.approve(approvedAmount, comments, approvedByUserId);

        expect(approval.getApprovalStatus()).toBe(AfeApprovalStatus.APPROVED);
        expect(approval.getApprovedAmount()).toBe(approvedAmount);
        expect(approval.getComments()).toBe(comments);
        expect(approval.getApprovedByUserId()).toBe(approvedByUserId);
        expect(approval.getApprovalDate()).toBeInstanceOf(Date);
        expect(approval.getUpdatedAt()).toBeInstanceOf(Date);
      });

      it('should approve without optional parameters', () => {
        approval.approve();

        expect(approval.getApprovalStatus()).toBe(AfeApprovalStatus.APPROVED);
        expect(approval.getApprovedAmount()).toBeUndefined();
        expect(approval.getComments()).toBeUndefined();
        expect(approval.getApprovedByUserId()).toBeUndefined();
        expect(approval.getApprovalDate()).toBeInstanceOf(Date);
      });
    });

    describe('reject', () => {
      it('should reject with reason', () => {
        const reason = 'Budget constraints';
        const rejectedByUserId = validUserId;

        approval.reject(reason, rejectedByUserId);

        expect(approval.getApprovalStatus()).toBe(AfeApprovalStatus.REJECTED);
        expect(approval.getComments()).toBe(reason);
        expect(approval.getApprovedByUserId()).toBe(rejectedByUserId);
        expect(approval.getApprovalDate()).toBeInstanceOf(Date);
      });

      it('should throw error for empty reason', () => {
        expect(() => {
          approval.reject('');
        }).toThrow('Rejection reason is required');

        expect(() => {
          approval.reject('   ');
        }).toThrow('Rejection reason is required');
      });
    });

    describe('conditionalApprove', () => {
      it('should conditionally approve with conditions', () => {
        const approvedAmount = new Money(25000, 'USD');
        const conditions = 'Subject to final engineering review';
        const approvedByUserId = validUserId;

        approval.conditionalApprove(
          approvedAmount,
          conditions,
          approvedByUserId,
        );

        expect(approval.getApprovalStatus()).toBe(
          AfeApprovalStatus.CONDITIONAL,
        );
        expect(approval.getApprovedAmount()).toBe(approvedAmount);
        expect(approval.getComments()).toBe(conditions);
        expect(approval.getApprovedByUserId()).toBe(approvedByUserId);
        expect(approval.getApprovalDate()).toBeInstanceOf(Date);
      });

      it('should throw error for empty conditions', () => {
        const approvedAmount = new Money(25000, 'USD');

        expect(() => {
          approval.conditionalApprove(approvedAmount, '');
        }).toThrow('Conditions are required for conditional approval');

        expect(() => {
          approval.conditionalApprove(approvedAmount, '   ');
        }).toThrow('Conditions are required for conditional approval');
      });
    });

    describe('updateComments', () => {
      it('should update comments', () => {
        const newComments = 'Updated approval notes';

        approval.updateComments(newComments);

        expect(approval.getComments()).toBe(newComments);
        expect(approval.getUpdatedAt()).toBeInstanceOf(Date);
      });
    });
  });

  describe('Status Check Methods', () => {
    it('should correctly identify pending status', () => {
      const approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.PENDING,
      );

      expect(approval.isPending()).toBe(true);
      expect(approval.isApproved()).toBe(false);
      expect(approval.isRejected()).toBe(false);
      expect(approval.isConditional()).toBe(false);
    });

    it('should correctly identify approved status', () => {
      const approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.APPROVED,
      );

      expect(approval.isPending()).toBe(false);
      expect(approval.isApproved()).toBe(true);
      expect(approval.isRejected()).toBe(false);
      expect(approval.isConditional()).toBe(false);
    });

    it('should correctly identify rejected status', () => {
      const approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.REJECTED,
        { comments: 'Rejected due to budget' },
      );

      expect(approval.isPending()).toBe(false);
      expect(approval.isApproved()).toBe(false);
      expect(approval.isRejected()).toBe(true);
      expect(approval.isConditional()).toBe(false);
    });

    it('should correctly identify conditional status', () => {
      const approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.CONDITIONAL,
        {
          approvedAmount: new Money(10000, 'USD'),
          comments: 'Subject to conditions',
        },
      );

      expect(approval.isPending()).toBe(false);
      expect(approval.isApproved()).toBe(false);
      expect(approval.isRejected()).toBe(false);
      expect(approval.isConditional()).toBe(true);
    });
  });

  describe('Persistence Methods', () => {
    it('should convert to persistence format', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const approvalDate = new Date('2024-01-03');
      const approvedAmount = new Money(50000, 'USD');

      const approval = new AfeApproval(
        validId,
        validAfeId,
        validPartnerId,
        AfeApprovalStatus.APPROVED,
        {
          approvedAmount,
          approvalDate,
          comments: 'Approved',
          approvedByUserId: validUserId,
        },
      );

      // Manually set timestamps for testing
      (approval as any).createdAt = createdAt;
      (approval as any).updatedAt = updatedAt;

      const persistenceData = approval.toPersistence();

      expect(persistenceData).toEqual({
        id: validId,
        afeId: validAfeId,
        partnerId: validPartnerId,
        approvalStatus: AfeApprovalStatus.APPROVED,
        approvedAmount: '50000.00 USD',
        approvalDate,
        comments: 'Approved',
        approvedByUserId: validUserId,
        createdAt,
        updatedAt,
      });
    });

    it('should create from persistence data', () => {
      const persistenceData = {
        id: validId,
        afeId: validAfeId,
        partnerId: validPartnerId,
        approvalStatus: AfeApprovalStatus.APPROVED,
        approvedAmount: '75000.50',
        approvalDate: new Date('2024-01-15'),
        comments: 'Approved with conditions',
        approvedByUserId: validUserId,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      const approval = AfeApproval.fromPersistence(persistenceData);

      expect(approval.getId()).toBe(validId);
      expect(approval.getAfeId()).toBe(validAfeId);
      expect(approval.getPartnerId()).toBe(validPartnerId);
      expect(approval.getApprovalStatus()).toBe(AfeApprovalStatus.APPROVED);
      expect(approval.getApprovedAmount()?.getAmount()).toBe(75000.5);
      expect(approval.getApprovedAmount()?.getCurrency()).toBe('USD');
      expect(approval.getApprovalDate()).toBe(persistenceData.approvalDate);
      expect(approval.getComments()).toBe(persistenceData.comments);
      expect(approval.getApprovedByUserId()).toBe(validUserId);
      expect(approval.getCreatedAt()).toBe(persistenceData.createdAt);
      expect(approval.getUpdatedAt()).toBe(persistenceData.updatedAt);
    });

    it('should handle undefined values in persistence data', () => {
      const persistenceData = {
        id: validId,
        afeId: validAfeId,
        partnerId: validPartnerId,
        approvalStatus: AfeApprovalStatus.PENDING,
        approvedAmount: undefined,
        approvalDate: undefined,
        comments: undefined,
        approvedByUserId: undefined,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const approval = AfeApproval.fromPersistence(persistenceData);

      expect(approval.getApprovedAmount()).toBeUndefined();
      expect(approval.getApprovalDate()).toBeUndefined();
      expect(approval.getComments()).toBeUndefined();
      expect(approval.getApprovedByUserId()).toBeUndefined();
    });
  });
});
