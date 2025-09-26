import { Permit } from '../permit.entity';
import { PermitStatus } from '../../value-objects/permit-status.vo';
import { PermitType } from '../../value-objects/permit-type.vo';
import { PermitCreatedEvent } from '../../events/permit-created.event';
import { PermitStatusChangedEvent } from '../../events/permit-status-changed.event';
import { PermitExpiredEvent } from '../../events/permit-expired.event';

describe('Permit Entity', () => {
  const validId = 'permit-123';
  const validPermitNumber = 'PERMIT-2024-001';
  const validOrganizationId = 'org-456';
  const validIssuingAgency = 'EPA';
  const validUserId = 'user-789';
  const validWellId = 'well-101';

  describe('Constructor', () => {
    it('should create permit with required fields', () => {
      const permitType = PermitType.DRILLING;
      const status = PermitStatus.DRAFT;

      const permit = new Permit(
        validId,
        validPermitNumber,
        permitType,
        validOrganizationId,
        validIssuingAgency,
        validUserId,
        status,
      );

      expect(permit.id).toBe(validId);
      expect(permit.permitNumber).toBe(validPermitNumber);
      expect(permit.permitType).toBe(permitType);
      expect(permit.status).toBe(status);
      expect(permit.organizationId).toBe(validOrganizationId);
      expect(permit.issuingAgency).toBe(validIssuingAgency);
      expect(permit.createdByUserId).toBe(validUserId);
      expect(permit.createdAt).toBeInstanceOf(Date);
      expect(permit.updatedAt).toBeInstanceOf(Date);
    });

    it('should create permit with default draft status', () => {
      const permitType = PermitType.DRILLING;

      const permit = new Permit(
        validId,
        validPermitNumber,
        permitType,
        validOrganizationId,
        validIssuingAgency,
        validUserId,
      );

      expect(permit.status).toBe(PermitStatus.DRAFT);
    });
  });

  describe('Factory Method - create', () => {
    it('should create permit and raise domain event', () => {
      const permitType = PermitType.DRILLING;

      const permit = Permit.create(
        validPermitNumber,
        permitType,
        validOrganizationId,
        validIssuingAgency,
        validUserId,
      );

      expect(permit.permitNumber).toBe(validPermitNumber);
      expect(permit.permitType).toBe(permitType);
      expect(permit.status).toBe(PermitStatus.DRAFT);
      expect(permit.organizationId).toBe(validOrganizationId);
      expect(permit.issuingAgency).toBe(validIssuingAgency);
      expect(permit.createdByUserId).toBe(validUserId);

      const domainEvents = permit.getDomainEvents();
      expect(domainEvents).toHaveLength(1);
      expect(domainEvents[0]).toBeInstanceOf(PermitCreatedEvent);
      const event = domainEvents[0] as PermitCreatedEvent;
      expect(event.permitNumber).toBe(validPermitNumber);
      expect(event.permitType).toBe(permitType.value);
    });
  });

  describe('Business Methods', () => {
    let permit: Permit;

    beforeEach(() => {
      const permitType = PermitType.DRILLING;
      permit = new Permit(
        validId,
        validPermitNumber,
        permitType,
        validOrganizationId,
        validIssuingAgency,
        validUserId,
        PermitStatus.DRAFT,
      );
    });

    describe('submit', () => {
      it('should submit permit from draft status', () => {
        permit.submit(validUserId);

        expect(permit.status).toBe(PermitStatus.SUBMITTED);
        expect(permit.submittedDate).toBeInstanceOf(Date);
        expect(permit.updatedByUserId).toBe(validUserId);
        expect(permit.updatedAt).toBeInstanceOf(Date);

        const domainEvents = permit.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(PermitStatusChangedEvent);
        const event = domainEvents[0] as PermitStatusChangedEvent;
        expect(event.oldStatus).toBe('draft');
        expect(event.newStatus).toBe('submitted');
      });

      it('should throw error for invalid status transition', () => {
        permit.status = PermitStatus.APPROVED;

        expect(() => {
          permit.submit(validUserId);
        }).toThrow('Cannot submit permit in status: approved');
      });
    });

    describe('approve', () => {
      beforeEach(() => {
        permit.status = PermitStatus.UNDER_REVIEW;
      });

      it('should approve permit', () => {
        const approvalDate = new Date('2024-02-01');
        permit.approve(validUserId, approvalDate);

        expect(permit.status).toBe(PermitStatus.APPROVED);
        expect(permit.approvalDate).toBe(approvalDate);
        expect(permit.updatedByUserId).toBe(validUserId);

        const domainEvents = permit.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(PermitStatusChangedEvent);
        const event = domainEvents[0] as PermitStatusChangedEvent;
        expect(event.oldStatus).toBe('under_review');
        expect(event.newStatus).toBe('approved');
      });

      it('should approve permit with current date if no approval date provided', () => {
        permit.approve(validUserId);

        expect(permit.status).toBe(PermitStatus.APPROVED);
        expect(permit.approvalDate).toBeInstanceOf(Date);
      });

      it('should throw error for invalid status transition', () => {
        permit.status = PermitStatus.DRAFT;

        expect(() => {
          permit.approve(validUserId);
        }).toThrow('Cannot approve permit in status: draft');
      });
    });

    describe('deny', () => {
      beforeEach(() => {
        permit.status = PermitStatus.UNDER_REVIEW;
      });

      it('should deny permit', () => {
        permit.deny(validUserId);

        expect(permit.status).toBe(PermitStatus.DENIED);
        expect(permit.updatedByUserId).toBe(validUserId);

        const domainEvents = permit.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(PermitStatusChangedEvent);
        const event = domainEvents[0] as PermitStatusChangedEvent;
        expect(event.oldStatus).toBe('under_review');
        expect(event.newStatus).toBe('denied');
      });

      it('should throw error for invalid status transition', () => {
        permit.status = PermitStatus.APPROVED;

        expect(() => {
          permit.deny(validUserId);
        }).toThrow('Cannot deny permit in status: approved');
      });
    });

    describe('expire', () => {
      beforeEach(() => {
        permit.status = PermitStatus.APPROVED;
      });

      it('should expire permit', () => {
        permit.expire(validUserId);

        expect(permit.status).toBe(PermitStatus.EXPIRED);
        expect(permit.expirationDate).toBeInstanceOf(Date);
        expect(permit.updatedByUserId).toBe(validUserId);

        const domainEvents = permit.getDomainEvents();
        expect(domainEvents).toHaveLength(2);
        expect(domainEvents[0]).toBeInstanceOf(PermitExpiredEvent);
        expect(domainEvents[1]).toBeInstanceOf(PermitStatusChangedEvent);
        const expiredEvent = domainEvents[0] as PermitExpiredEvent;
        expect(expiredEvent.permitNumber).toBe(validPermitNumber);
        const statusEvent = domainEvents[1] as PermitStatusChangedEvent;
        expect(statusEvent.oldStatus).toBe('approved');
        expect(statusEvent.newStatus).toBe('expired');
      });

      it('should expire permit without user ID', () => {
        permit.expire();

        expect(permit.status).toBe(PermitStatus.EXPIRED);
        expect(permit.updatedByUserId).toBeUndefined();
      });

      it('should throw error for invalid status transition', () => {
        permit.status = PermitStatus.DRAFT;

        expect(() => {
          permit.expire(validUserId);
        }).toThrow('Cannot expire permit in status: draft');
      });
    });

    describe('renew', () => {
      beforeEach(() => {
        permit.status = PermitStatus.APPROVED;
      });

      it('should renew permit', () => {
        const newExpirationDate = new Date('2026-01-01');
        permit.renew(validUserId, newExpirationDate);

        expect(permit.status).toBe(PermitStatus.RENEWED);
        expect(permit.expirationDate).toBe(newExpirationDate);
        expect(permit.updatedByUserId).toBe(validUserId);

        const domainEvents = permit.getDomainEvents();
        expect(domainEvents).toHaveLength(1);
        expect(domainEvents[0]).toBeInstanceOf(PermitStatusChangedEvent);
        const event = domainEvents[0] as PermitStatusChangedEvent;
        expect(event.oldStatus).toBe('approved');
        expect(event.newStatus).toBe('renewed');
      });

      it('should throw error for invalid status transition', () => {
        permit.status = PermitStatus.DRAFT;

        expect(() => {
          permit.renew(validUserId, new Date());
        }).toThrow('Cannot renew permit in status: draft');
      });
    });

    describe('updateConditions', () => {
      it('should update permit conditions', () => {
        const conditions = { environmental: 'approved', safety: 'pending' };
        permit.updateConditions(conditions, validUserId);

        expect(permit.permitConditions).toBe(conditions);
        expect(permit.updatedByUserId).toBe(validUserId);
        expect(permit.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('updateComplianceRequirements', () => {
      it('should update compliance requirements', () => {
        const requirements = { reporting: 'monthly', monitoring: 'quarterly' };
        permit.updateComplianceRequirements(requirements, validUserId);

        expect(permit.complianceRequirements).toBe(requirements);
        expect(permit.updatedByUserId).toBe(validUserId);
      });
    });

    describe('markAsExpired', () => {
      beforeEach(() => {
        permit.status = PermitStatus.APPROVED;
        permit.expirationDate = new Date('2024-01-01'); // Past date
      });

      it('should mark permit as expired if past expiration date', () => {
        permit.markAsExpired();

        expect(permit.status).toBe(PermitStatus.EXPIRED);
      });

      it('should throw error if not past expiration date', () => {
        permit.expirationDate = new Date('2026-01-01'); // Future date

        expect(() => {
          permit.markAsExpired();
        }).toThrow('Cannot mark permit as expired before expiration date');
      });

      it('should not change status if already expired', () => {
        permit.status = PermitStatus.EXPIRED;

        permit.markAsExpired();

        expect(permit.status).toBe(PermitStatus.EXPIRED);
      });

      it('should mark as expired if no expiration date set', () => {
        permit.expirationDate = undefined;

        permit.markAsExpired();

        expect(permit.status).toBe(PermitStatus.EXPIRED);
      });
    });

    describe('canBeRenewed', () => {
      it('should return true for approved permit with future expiration', () => {
        permit.status = PermitStatus.APPROVED;
        permit.expirationDate = new Date('2026-01-01');

        expect(permit.canBeRenewed()).toBe(true);
      });

      it('should return false for expired permit', () => {
        permit.status = PermitStatus.APPROVED;
        permit.expirationDate = new Date('2023-01-01');

        expect(permit.canBeRenewed()).toBe(false);
      });

      it('should return false for non-approved status', () => {
        permit.status = PermitStatus.DRAFT;
        permit.expirationDate = new Date('2025-01-01');

        expect(permit.canBeRenewed()).toBe(false);
      });

      it('should return false if no expiration date', () => {
        permit.status = PermitStatus.APPROVED;
        permit.expirationDate = undefined;

        expect(permit.canBeRenewed()).toBe(false);
      });
    });

    describe('revertExpirationDate', () => {
      it('should revert expiration date', () => {
        const originalDate = new Date('2024-01-01');
        permit.revertExpirationDate(originalDate);

        expect(permit.expirationDate).toBe(originalDate);
        expect(permit.updatedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Business Logic Queries', () => {
    let permit: Permit;

    beforeEach(() => {
      const permitType = PermitType.DRILLING;
      permit = new Permit(
        validId,
        validPermitNumber,
        permitType,
        validOrganizationId,
        validIssuingAgency,
        validUserId,
        PermitStatus.APPROVED,
      );
    });

    describe('isExpired', () => {
      it('should return true if past expiration date', () => {
        permit.expirationDate = new Date('2023-01-01');

        expect(permit.isExpired()).toBe(true);
      });

      it('should return false if no expiration date', () => {
        permit.expirationDate = undefined;

        expect(permit.isExpired()).toBe(false);
      });

      it('should return false if future expiration date', () => {
        permit.expirationDate = new Date('2026-01-01');

        expect(permit.isExpired()).toBe(false);
      });
    });

    describe('isExpiringSoon', () => {
      it('should return true if expiring within default 30 days', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 15);
        permit.expirationDate = futureDate;

        expect(permit.isExpiringSoon()).toBe(true);
      });

      it('should return false if expiring after specified days', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60);
        permit.expirationDate = futureDate;

        expect(permit.isExpiringSoon(30)).toBe(false);
      });

      it('should return false if no expiration date', () => {
        permit.expirationDate = undefined;

        expect(permit.isExpiringSoon()).toBe(false);
      });
    });

    describe('requiresRenewal', () => {
      it('should return true for permit types requiring renewal and expiring soon', () => {
        permit.permitType = PermitType.FACILITY; // Has renewal requirements
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60);
        permit.expirationDate = futureDate;

        expect(permit.requiresRenewal()).toBe(true);
      });

      it('should return false for permit types not requiring renewal', () => {
        permit.permitType = PermitType.DRILLING; // No renewal requirements
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 60);
        permit.expirationDate = futureDate;

        expect(permit.requiresRenewal()).toBe(false);
      });
    });

    describe('isActive', () => {
      it('should return true for approved status and not expired', () => {
        permit.status = PermitStatus.APPROVED;
        permit.expirationDate = new Date('2026-01-01');

        expect(permit.isActive()).toBe(true);
      });

      it('should return true for renewed status', () => {
        permit.status = PermitStatus.RENEWED;

        expect(permit.isActive()).toBe(true);
      });

      it('should return false for expired permit', () => {
        permit.status = PermitStatus.APPROVED;
        permit.expirationDate = new Date('2023-01-01');

        expect(permit.isActive()).toBe(false);
      });

      it('should return false for draft status', () => {
        permit.status = PermitStatus.DRAFT;

        expect(permit.isActive()).toBe(false);
      });
    });
  });

  describe('Getters and Setters', () => {
    let permit: Permit;

    beforeEach(() => {
      const permitType = PermitType.DRILLING;
      permit = new Permit(
        validId,
        validPermitNumber,
        permitType,
        validOrganizationId,
        validIssuingAgency,
        validUserId,
      );
    });

    it('should get and set wellId', () => {
      permit.wellId = validWellId;
      expect(permit.wellId).toBe(validWellId);
    });

    it('should get and set regulatoryAuthority', () => {
      const authority = 'State EPA';
      permit.regulatoryAuthority = authority;
      expect(permit.regulatoryAuthority).toBe(authority);
    });

    it('should get and set applicationDate', () => {
      const date = new Date('2024-01-01');
      permit.applicationDate = date;
      expect(permit.applicationDate).toBe(date);
    });

    it('should get and set submittedDate', () => {
      const date = new Date('2024-01-02');
      permit.submittedDate = date;
      expect(permit.submittedDate).toBe(date);
    });

    it('should get and set approvalDate', () => {
      const date = new Date('2024-01-15');
      permit.approvalDate = date;
      expect(permit.approvalDate).toBe(date);
    });

    it('should get and set expirationDate', () => {
      const date = new Date('2025-01-01');
      permit.expirationDate = date;
      expect(permit.expirationDate).toBe(date);
    });

    it('should get and set permitConditions', () => {
      const conditions = { test: 'value' };
      permit.permitConditions = conditions;
      expect(permit.permitConditions).toBe(conditions);
    });

    it('should get and set complianceRequirements', () => {
      const requirements = { test: 'value' };
      permit.complianceRequirements = requirements;
      expect(permit.complianceRequirements).toBe(requirements);
    });

    it('should get and set feeAmount', () => {
      const amount = 1000;
      permit.feeAmount = amount;
      expect(permit.feeAmount).toBe(amount);
    });

    it('should get and set bondAmount', () => {
      const amount = 50000;
      permit.bondAmount = amount;
      expect(permit.bondAmount).toBe(amount);
    });

    it('should get and set bondType', () => {
      const type = 'surety';
      permit.bondType = type;
      expect(permit.bondType).toBe(type);
    });

    it('should get and set location', () => {
      const location = 'Well Site A';
      permit.location = location;
      expect(permit.location).toBe(location);
    });

    it('should get and set facilityId', () => {
      const facilityId = 'facility-123';
      permit.facilityId = facilityId;
      expect(permit.facilityId).toBe(facilityId);
    });

    it('should get and set documentIds', () => {
      const documentIds = ['doc1', 'doc2'];
      permit.documentIds = documentIds;
      expect(permit.documentIds).toBe(documentIds);
    });

    it('should get and set updatedByUserId', () => {
      permit.updatedByUserId = validUserId;
      expect(permit.updatedByUserId).toBe(validUserId);
    });

    it('should get and set createdAt', () => {
      const date = new Date('2024-01-01');
      permit.createdAt = date;
      expect(permit.createdAt).toBe(date);
    });

    it('should get and set updatedAt', () => {
      const date = new Date('2024-01-02');
      permit.updatedAt = date;
      expect(permit.updatedAt).toBe(date);
    });

    it('should get and set permitNumber', () => {
      const newNumber = 'PERMIT-2024-002';
      permit.permitNumber = newNumber;
      expect(permit.permitNumber).toBe(newNumber);
    });

    it('should get and set permitType', () => {
      const newType = PermitType.COMPLETION;
      permit.permitType = newType;
      expect(permit.permitType).toBe(newType);
    });

    it('should get and set status', () => {
      const newStatus = PermitStatus.SUBMITTED;
      permit.status = newStatus;
      expect(permit.status).toBe(newStatus);
    });
  });

  describe('Entity Interface', () => {
    it('should implement getId method', () => {
      const permitType = PermitType.DRILLING;
      const permit = new Permit(
        validId,
        validPermitNumber,
        permitType,
        validOrganizationId,
        validIssuingAgency,
        validUserId,
      );

      const id = permit.getId();
      expect(id.getValue()).toBe(validId);
    });
  });
});
