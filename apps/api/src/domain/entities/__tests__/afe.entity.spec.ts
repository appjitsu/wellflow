import { Afe } from '../afe.entity';
import { AfeNumber } from '../../value-objects/afe-number';
import { Money } from '../../value-objects/money';
import { AfeStatus, AfeType } from '../../enums/afe-status.enum';
import { AfeCreatedEvent } from '../../events/afe-created.event';
import { AfeStatusChangedEvent } from '../../events/afe-status-changed.event';
import { AfeSubmittedEvent } from '../../events/afe-submitted.event';
import { AfeApprovedEvent } from '../../events/afe-approved.event';
import { AfeRejectedEvent } from '../../events/afe-rejected.event';

describe('Afe Entity', () => {
  let afe: Afe;
  const afeId = 'test-afe-id';
  const organizationId = 'test-org-id';
  const afeNumber = new AfeNumber('AFE-2024-0001');
  const afeType = AfeType.DRILLING;
  const estimatedCost = new Money(1500000);

  beforeEach(() => {
    afe = new Afe(afeId, organizationId, afeNumber, afeType, {
      totalEstimatedCost: estimatedCost,
      description: 'Test drilling AFE',
    });
  });

  describe('constructor', () => {
    it('should create AFE with required properties', () => {
      expect(afe.getId()).toBe(afeId);
      expect(afe.getOrganizationId()).toBe(organizationId);
      expect(afe.getAfeNumber()).toBe(afeNumber);
      expect(afe.getAfeType()).toBe(afeType);
      expect(afe.getStatus()).toBe(AfeStatus.DRAFT);
      expect(afe.getTotalEstimatedCost()).toBe(estimatedCost);
      expect(afe.getDescription()).toBe('Test drilling AFE');
      expect(afe.getVersion()).toBe(1);
    });

    it('should raise AFE created domain event', () => {
      const events = afe.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AfeCreatedEvent);

      const createdEvent = events[0] as AfeCreatedEvent;
      expect(createdEvent.afeId).toBe(afeId);
      expect(createdEvent.organizationId).toBe(organizationId);
      expect(createdEvent.afeNumber).toBe(afeNumber.getValue());
      expect(createdEvent.afeType).toBe(afeType);
      expect(createdEvent.estimatedCost).toBe(estimatedCost.getAmount());
    });

    it('should create AFE with optional properties', () => {
      const wellId = 'test-well-id';
      const leaseId = 'test-lease-id';

      const afeWithOptions = new Afe(
        afeId,
        organizationId,
        afeNumber,
        afeType,
        {
          wellId,
          leaseId,
          totalEstimatedCost: estimatedCost,
          description: 'Test AFE with options',
          status: AfeStatus.SUBMITTED,
        },
      );

      expect(afeWithOptions.getWellId()).toBe(wellId);
      expect(afeWithOptions.getLeaseId()).toBe(leaseId);
      expect(afeWithOptions.getStatus()).toBe(AfeStatus.SUBMITTED);
    });
  });

  describe('status transitions', () => {
    it('should allow valid status transitions', () => {
      // DRAFT -> SUBMITTED
      afe.updateStatus(AfeStatus.SUBMITTED, 'user-123');
      expect(afe.getStatus()).toBe(AfeStatus.SUBMITTED);
      expect(afe.getVersion()).toBe(2);

      // SUBMITTED -> APPROVED
      afe.updateStatus(AfeStatus.APPROVED, 'manager-456');
      expect(afe.getStatus()).toBe(AfeStatus.APPROVED);
      expect(afe.getApprovalDate()).toBeDefined();
      expect(afe.getVersion()).toBe(3);

      // APPROVED -> CLOSED
      afe.updateStatus(AfeStatus.CLOSED, 'user-123');
      expect(afe.getStatus()).toBe(AfeStatus.CLOSED);
      expect(afe.getVersion()).toBe(4);
    });

    it('should reject invalid status transitions', () => {
      // DRAFT -> APPROVED (skipping SUBMITTED)
      expect(() => {
        afe.updateStatus(AfeStatus.APPROVED, 'user-123');
      }).toThrow('Invalid status transition from draft to approved');

      // DRAFT -> CLOSED (skipping SUBMITTED and APPROVED)
      expect(() => {
        afe.updateStatus(AfeStatus.CLOSED, 'user-123');
      }).toThrow('Invalid status transition from draft to closed');
    });

    it('should raise status changed domain events', () => {
      afe.clearDomainEvents(); // Clear creation event

      afe.updateStatus(AfeStatus.SUBMITTED, 'user-123');

      const events = afe.getDomainEvents();
      expect(events).toHaveLength(2); // StatusChanged + Submitted

      const statusChangedEvent = events.find(
        (e) => e instanceof AfeStatusChangedEvent,
      ) as AfeStatusChangedEvent;
      expect(statusChangedEvent).toBeDefined();
      expect(statusChangedEvent.afeId).toBe(afeId);
      expect(statusChangedEvent.previousStatus).toBe(AfeStatus.DRAFT);
      expect(statusChangedEvent.newStatus).toBe(AfeStatus.SUBMITTED);
      expect(statusChangedEvent.updatedBy).toBe('user-123');

      const submittedEvent = events.find(
        (e) => e instanceof AfeSubmittedEvent,
      ) as AfeSubmittedEvent;
      expect(submittedEvent).toBeDefined();
      expect(submittedEvent.afeId).toBe(afeId);
      expect(submittedEvent.submittedBy).toBe('user-123');
    });
  });

  describe('submit', () => {
    it('should submit AFE successfully', () => {
      afe.submit('user-123');

      expect(afe.getStatus()).toBe(AfeStatus.SUBMITTED);

      const events = afe.getDomainEvents();
      const submittedEvent = events.find((e) => e instanceof AfeSubmittedEvent);
      expect(submittedEvent).toBeDefined();
    });

    it('should validate AFE before submission', () => {
      // AFE without estimated cost
      const invalidAfe = new Afe(afeId, organizationId, afeNumber, afeType);

      expect(() => {
        invalidAfe.submit('user-123');
      }).toThrow('Total estimated cost is required for submission');
    });

    it('should require positive estimated cost', () => {
      const invalidAfe = new Afe(afeId, organizationId, afeNumber, afeType, {
        totalEstimatedCost: new Money(0),
        description: 'Test AFE',
      });

      expect(() => {
        invalidAfe.submit('user-123');
      }).toThrow('Total estimated cost must be greater than zero');
    });

    it('should require description for submission', () => {
      const invalidAfe = new Afe(afeId, organizationId, afeNumber, afeType, {
        totalEstimatedCost: estimatedCost,
      });

      expect(() => {
        invalidAfe.submit('user-123');
      }).toThrow('Description is required for submission');
    });
  });

  describe('approve', () => {
    beforeEach(() => {
      afe.submit('user-123');
    });

    it('should approve AFE successfully', () => {
      const approvedAmount = new Money(1400000);

      afe.approve('manager-456', approvedAmount);

      expect(afe.getStatus()).toBe(AfeStatus.APPROVED);
      expect(afe.getApprovedAmount()).toBe(approvedAmount);
      expect(afe.getApprovalDate()).toBeDefined();

      const events = afe.getDomainEvents();
      const approvedEvent = events.find(
        (e) => e instanceof AfeApprovedEvent,
      ) as AfeApprovedEvent;
      expect(approvedEvent).toBeDefined();
      expect(approvedEvent.approvedAmount).toBe(approvedAmount.getAmount());
      expect(approvedEvent.approvedBy).toBe('manager-456');
    });

    it('should approve without specific amount', () => {
      afe.approve('manager-456');

      expect(afe.getStatus()).toBe(AfeStatus.APPROVED);
      expect(afe.getApprovedAmount()).toBeUndefined();
    });

    it('should only allow approval of submitted AFEs', () => {
      const draftAfe = new Afe(afeId, organizationId, afeNumber, afeType, {
        totalEstimatedCost: estimatedCost,
        description: 'Test AFE',
      });

      expect(() => {
        draftAfe.approve('manager-456');
      }).toThrow('AFE must be in submitted status to approve');
    });
  });

  describe('reject', () => {
    beforeEach(() => {
      afe.submit('user-123');
    });

    it('should reject AFE successfully', () => {
      afe.reject('manager-456');

      expect(afe.getStatus()).toBe(AfeStatus.REJECTED);

      const events = afe.getDomainEvents();
      const rejectedEvent = events.find(
        (e) => e instanceof AfeRejectedEvent,
      ) as AfeRejectedEvent;
      expect(rejectedEvent).toBeDefined();
      expect(rejectedEvent.rejectedBy).toBe('manager-456');
    });

    it('should only allow rejection of submitted AFEs', () => {
      const draftAfe = new Afe(afeId, organizationId, afeNumber, afeType, {
        totalEstimatedCost: estimatedCost,
        description: 'Test AFE',
      });

      expect(() => {
        draftAfe.reject('manager-456');
      }).toThrow('AFE must be in submitted status to reject');
    });
  });

  describe('cost updates', () => {
    it('should update estimated cost in draft status', () => {
      const newCost = new Money(1600000);

      afe.updateEstimatedCost(newCost);

      expect(afe.getTotalEstimatedCost()).toBe(newCost);
      expect(afe.getVersion()).toBe(2);
    });

    it('should not allow estimated cost update after submission', () => {
      afe.submit('user-123');

      expect(() => {
        afe.updateEstimatedCost(new Money(1600000));
      }).toThrow('Cannot update estimated cost after AFE is submitted');
    });

    it('should update actual cost for approved AFEs', () => {
      afe.submit('user-123');
      afe.approve('manager-456');

      const actualCost = new Money(1450000);
      afe.updateActualCost(actualCost);

      expect(afe.getActualCost()).toBe(actualCost);
      expect(afe.getVersion()).toBe(4);
    });

    it('should not allow actual cost update for non-approved AFEs', () => {
      expect(() => {
        afe.updateActualCost(new Money(1450000));
      }).toThrow('Can only update actual cost for approved or closed AFEs');
    });
  });

  describe('close', () => {
    it('should close approved AFE', () => {
      afe.submit('user-123');
      afe.approve('manager-456');

      afe.close();

      expect(afe.getStatus()).toBe(AfeStatus.CLOSED);
    });

    it('should only allow closing approved AFEs', () => {
      expect(() => {
        afe.close();
      }).toThrow('Can only close approved AFEs');
    });
  });

  describe('persistence', () => {
    it('should convert to persistence format', () => {
      const persistenceData = afe.toPersistence();

      expect(persistenceData.id).toBe(afeId);
      expect(persistenceData.organizationId).toBe(organizationId);
      expect(persistenceData.afeNumber).toBe(afeNumber.getValue());
      expect(persistenceData.afeType).toBe(afeType);
      expect(persistenceData.status).toBe(AfeStatus.DRAFT);
      expect(persistenceData.totalEstimatedCost).toBe(estimatedCost.toString());
      expect(persistenceData.description).toBe('Test drilling AFE');
      expect(persistenceData.version).toBe(1);
    });

    it('should create from persistence format', () => {
      const persistenceData = afe.toPersistence();
      const restoredAfe = Afe.fromPersistence(persistenceData);

      expect(restoredAfe.getId()).toBe(afe.getId());
      expect(restoredAfe.getOrganizationId()).toBe(afe.getOrganizationId());
      expect(restoredAfe.getAfeNumber().getValue()).toBe(
        afe.getAfeNumber().getValue(),
      );
      expect(restoredAfe.getAfeType()).toBe(afe.getAfeType());
      expect(restoredAfe.getStatus()).toBe(afe.getStatus());
      expect(restoredAfe.getTotalEstimatedCost()?.getAmount()).toBe(
        afe.getTotalEstimatedCost()?.getAmount(),
      );
      expect(restoredAfe.getDescription()).toBe(afe.getDescription());
      expect(restoredAfe.getVersion()).toBe(afe.getVersion());

      // Should not have domain events from persistence
      expect(restoredAfe.getDomainEvents()).toHaveLength(0);
    });
  });
});
