import {
  DivisionOrder,
  DivisionOrderPersistenceData,
} from './division-order.entity';
import { DecimalInterest } from '../value-objects/decimal-interest';
import { DivisionOrderCreatedEvent } from '../events/division-order-created.event';
import { DivisionOrderUpdatedEvent } from '../events/division-order-updated.event';
import { DivisionOrderActivatedEvent } from '../events/division-order-activated.event';
import { DivisionOrderDeactivatedEvent } from '../events/division-order-deactivated.event';

describe('DivisionOrder', () => {
  describe('constructor', () => {
    it('should create division order with minimal required properties', () => {
      const decimalInterest = new DecimalInterest(0.125);
      const effectiveDate = new Date('2024-01-01');

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        decimalInterest,
        effectiveDate,
      );

      expect(divisionOrder.getId()).toBe('do-123');
      expect(divisionOrder.getOrganizationId()).toBe('org-456');
      expect(divisionOrder.getWellId()).toBe('well-789');
      expect(divisionOrder.getPartnerId()).toBe('partner-101');
      expect(divisionOrder.getDecimalInterest()).toBe(decimalInterest);
      expect(divisionOrder.getEffectiveDate()).toEqual(effectiveDate);
      expect(divisionOrder.getIsActive()).toBe(true);
      expect(divisionOrder.getEndDate()).toBeUndefined();
      expect(divisionOrder.getVersion()).toBe(1);
      expect(divisionOrder.getDomainEvents()).toHaveLength(1);
    });

    it('should create division order with all optional properties', () => {
      const decimalInterest = new DecimalInterest(0.25);
      const effectiveDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        decimalInterest,
        effectiveDate,
        {
          endDate,
          isActive: false,
        },
      );

      expect(divisionOrder.getEndDate()).toEqual(endDate);
      expect(divisionOrder.getIsActive()).toBe(false);
    });

    it('should raise DivisionOrderCreatedEvent on creation', () => {
      const decimalInterest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        decimalInterest,
        effectiveDate,
      );

      const events = divisionOrder.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(DivisionOrderCreatedEvent);

      const event = events[0] as DivisionOrderCreatedEvent;
      expect(event.divisionOrderId).toBe('do-123');
      expect(event.organizationId).toBe('org-456');
      expect(event.wellId).toBe('well-789');
      expect(event.partnerId).toBe('partner-101');
      expect(event.decimalInterest).toBe(0.1);
      expect(event.effectiveDate).toEqual(effectiveDate);
    });

    it('should create copies of date objects to prevent external mutation', () => {
      const decimalInterest = new DecimalInterest(0.05);
      const effectiveDate = new Date(2024, 0, 1); // January 1, 2024
      const endDate = new Date(2024, 11, 31); // December 31, 2024

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        decimalInterest,
        effectiveDate,
        { endDate },
      );

      // Modify returned dates
      const returnedEffectiveDate = divisionOrder.getEffectiveDate();
      const returnedEndDate = divisionOrder.getEndDate();

      returnedEffectiveDate.setFullYear(2023);
      returnedEndDate?.setMonth(5);

      // Entity dates should remain unchanged
      expect(divisionOrder.getEffectiveDate().getFullYear()).toBe(2024);
      expect(divisionOrder.getEndDate()?.getMonth()).toBe(11); // December
    });
  });

  describe('validation', () => {
    it('should throw error for empty organizationId', () => {
      const decimalInterest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');

      expect(
        () =>
          new DivisionOrder(
            'do-123',
            '',
            'well-789',
            'partner-101',
            decimalInterest,
            effectiveDate,
          ),
      ).toThrow('Organization ID is required');
    });

    it('should throw error for empty wellId', () => {
      const decimalInterest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');

      expect(
        () =>
          new DivisionOrder(
            'do-123',
            'org-456',
            '',
            'partner-101',
            decimalInterest,
            effectiveDate,
          ),
      ).toThrow('Well ID is required');
    });

    it('should throw error for empty partnerId', () => {
      const decimalInterest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');

      expect(
        () =>
          new DivisionOrder(
            'do-123',
            'org-456',
            'well-789',
            '',
            decimalInterest,
            effectiveDate,
          ),
      ).toThrow('Partner ID is required');
    });

    it('should throw error for future effective date', () => {
      const decimalInterest = new DecimalInterest(0.1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

      expect(
        () =>
          new DivisionOrder(
            'do-123',
            'org-456',
            'well-789',
            'partner-101',
            decimalInterest,
            futureDate,
          ),
      ).toThrow('Effective date cannot be in the future');
    });

    it('should throw error for end date before effective date', () => {
      const decimalInterest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');
      const endDate = new Date('2023-12-31');

      expect(
        () =>
          new DivisionOrder(
            'do-123',
            'org-456',
            'well-789',
            'partner-101',
            decimalInterest,
            effectiveDate,
            { endDate },
          ),
      ).toThrow('End date must be after effective date');
    });

    it('should throw error for end date equal to effective date', () => {
      const decimalInterest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-01');

      expect(
        () =>
          new DivisionOrder(
            'do-123',
            'org-456',
            'well-789',
            'partner-101',
            decimalInterest,
            effectiveDate,
            { endDate },
          ),
      ).toThrow('End date must be after effective date');
    });
  });

  describe('getters', () => {
    let divisionOrder: DivisionOrder;
    let decimalInterest: DecimalInterest;
    let effectiveDate: Date;
    let endDate: Date;

    beforeEach(() => {
      decimalInterest = new DecimalInterest(0.075);
      effectiveDate = new Date(2024, 0, 1); // January 1, 2024
      endDate = new Date(2024, 11, 31); // December 31, 2024

      divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        decimalInterest,
        effectiveDate,
        { endDate, isActive: false },
      );
    });

    it('should return correct id', () => {
      expect(divisionOrder.getId()).toBe('do-123');
    });

    it('should return correct organizationId', () => {
      expect(divisionOrder.getOrganizationId()).toBe('org-456');
    });

    it('should return correct wellId', () => {
      expect(divisionOrder.getWellId()).toBe('well-789');
    });

    it('should return correct partnerId', () => {
      expect(divisionOrder.getPartnerId()).toBe('partner-101');
    });

    it('should return correct decimalInterest', () => {
      expect(divisionOrder.getDecimalInterest()).toBe(decimalInterest);
    });

    it('should return correct effectiveDate', () => {
      expect(divisionOrder.getEffectiveDate()).toEqual(effectiveDate);
    });

    it('should return correct endDate', () => {
      expect(divisionOrder.getEndDate()).toEqual(endDate);
    });

    it('should return correct isActive', () => {
      expect(divisionOrder.getIsActive()).toBe(false);
    });

    it('should return correct version', () => {
      expect(divisionOrder.getVersion()).toBe(1);
    });

    it('should return copies of dates to prevent external mutation', () => {
      const returnedEffectiveDate = divisionOrder.getEffectiveDate();
      const returnedEndDate = divisionOrder.getEndDate();

      returnedEffectiveDate.setFullYear(2023);
      returnedEndDate?.setMonth(5);

      // Entity dates should remain unchanged
      expect(divisionOrder.getEffectiveDate().getFullYear()).toBe(2024);
      expect(divisionOrder.getEndDate()?.getMonth()).toBe(11);
    });
  });

  describe('business methods', () => {
    describe('updateDecimalInterest', () => {
      it('should update decimal interest and raise domain event', () => {
        const initialInterest = new DecimalInterest(0.1);
        const newInterest = new DecimalInterest(0.15);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          initialInterest,
          effectiveDate,
        );

        divisionOrder.clearDomainEvents(); // Clear creation event

        divisionOrder.updateDecimalInterest(newInterest, 'user-789');

        expect(divisionOrder.getDecimalInterest()).toBe(newInterest);
        expect(divisionOrder.getVersion()).toBe(2);

        const events = divisionOrder.getDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(DivisionOrderUpdatedEvent);

        const event = events[0] as DivisionOrderUpdatedEvent;
        expect(event.divisionOrderId).toBe('do-123');
        expect(event.previousDecimalInterest).toBe(0.1);
        expect(event.newDecimalInterest).toBe(0.15);
        expect(event.updatedBy).toBe('user-789');
      });

      it('should not update if interest is the same', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
        );

        divisionOrder.clearDomainEvents();

        divisionOrder.updateDecimalInterest(
          new DecimalInterest(0.1),
          'user-789',
        );

        expect(divisionOrder.getVersion()).toBe(1); // Should not increment
        expect(divisionOrder.getDomainEvents()).toHaveLength(0);
      });
    });

    describe('activate', () => {
      it('should activate division order and raise domain event', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { endDate, isActive: false },
        );

        divisionOrder.clearDomainEvents();

        divisionOrder.activate('user-789');

        expect(divisionOrder.getIsActive()).toBe(true);
        expect(divisionOrder.getEndDate()).toBeUndefined(); // Should clear end date
        expect(divisionOrder.getVersion()).toBe(2);

        const events = divisionOrder.getDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(DivisionOrderActivatedEvent);

        const event = events[0] as DivisionOrderActivatedEvent;
        expect(event.divisionOrderId).toBe('do-123');
        expect(event.activatedBy).toBe('user-789');
      });

      it('should not activate if already active', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { isActive: true },
        );

        divisionOrder.clearDomainEvents();

        divisionOrder.activate('user-789');

        expect(divisionOrder.getVersion()).toBe(1); // Should not increment
        expect(divisionOrder.getDomainEvents()).toHaveLength(0);
      });
    });

    describe('deactivate', () => {
      it('should deactivate division order and raise domain event', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
        );

        divisionOrder.clearDomainEvents();

        divisionOrder.deactivate(endDate, 'user-789');

        expect(divisionOrder.getIsActive()).toBe(false);
        expect(divisionOrder.getEndDate()).toEqual(endDate);
        expect(divisionOrder.getVersion()).toBe(2);

        const events = divisionOrder.getDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(DivisionOrderDeactivatedEvent);

        const event = events[0] as DivisionOrderDeactivatedEvent;
        expect(event.divisionOrderId).toBe('do-123');
        expect(event.endDate).toEqual(endDate);
        expect(event.deactivatedBy).toBe('user-789');
      });

      it('should not deactivate if already inactive', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { isActive: false },
        );

        divisionOrder.clearDomainEvents();

        divisionOrder.deactivate(endDate, 'user-789');

        expect(divisionOrder.getVersion()).toBe(1); // Should not increment
        expect(divisionOrder.getDomainEvents()).toHaveLength(0);
      });

      it('should throw error for invalid end date', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');
        const invalidEndDate = new Date('2023-12-31');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
        );

        expect(() => {
          divisionOrder.deactivate(invalidEndDate, 'user-789');
        }).toThrow('End date must be after effective date');
      });
    });
  });

  describe('business logic methods', () => {
    describe('isEffectiveOn', () => {
      it('should return true for date within effective period', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { endDate },
        );

        expect(divisionOrder.isEffectiveOn(new Date('2024-06-15'))).toBe(true);
      });

      it('should return false for date before effective date', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
        );

        expect(divisionOrder.isEffectiveOn(new Date('2023-12-31'))).toBe(false);
      });

      it('should return false for date after end date', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { endDate },
        );

        expect(divisionOrder.isEffectiveOn(new Date('2025-01-01'))).toBe(false);
      });

      it('should return false for inactive division order', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { isActive: false },
        );

        expect(divisionOrder.isEffectiveOn(new Date('2024-06-15'))).toBe(false);
      });

      it('should return true for date on effective date boundary', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
        );

        expect(divisionOrder.isEffectiveOn(effectiveDate)).toBe(true);
      });

      it('should return true for date on end date boundary if active', () => {
        const interest = new DecimalInterest(0.1);
        const effectiveDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        const divisionOrder = new DivisionOrder(
          'do-123',
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { endDate },
        );

        expect(divisionOrder.isEffectiveOn(endDate)).toBe(true);
      });
    });

    describe('overlapsWith', () => {
      it('should return true for overlapping division orders', () => {
        const interest1 = new DecimalInterest(0.1);
        const interest2 = new DecimalInterest(0.2);
        const effectiveDate1 = new Date('2024-01-01');
        const effectiveDate2 = new Date('2024-06-01');

        const divisionOrder1 = new DivisionOrder(
          'do-1',
          'org-456',
          'well-789',
          'partner-101',
          interest1,
          effectiveDate1,
        );

        const divisionOrder2 = new DivisionOrder(
          'do-2',
          'org-456',
          'well-789',
          'partner-101',
          interest2,
          effectiveDate2,
        );

        expect(divisionOrder1.overlapsWith(divisionOrder2)).toBe(true);
        expect(divisionOrder2.overlapsWith(divisionOrder1)).toBe(true);
      });

      it('should return false for non-overlapping division orders', () => {
        const interest1 = new DecimalInterest(0.1);
        const interest2 = new DecimalInterest(0.2);
        const effectiveDate1 = new Date('2024-01-01');
        const endDate1 = new Date('2024-05-31');
        const effectiveDate2 = new Date('2024-06-01');

        const divisionOrder1 = new DivisionOrder(
          'do-1',
          'org-456',
          'well-789',
          'partner-101',
          interest1,
          effectiveDate1,
          { endDate: endDate1 },
        );

        const divisionOrder2 = new DivisionOrder(
          'do-2',
          'org-456',
          'well-789',
          'partner-101',
          interest2,
          effectiveDate2,
        );

        expect(divisionOrder1.overlapsWith(divisionOrder2)).toBe(false);
        expect(divisionOrder2.overlapsWith(divisionOrder1)).toBe(false);
      });

      it('should return false for different wells', () => {
        const interest1 = new DecimalInterest(0.1);
        const interest2 = new DecimalInterest(0.2);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder1 = new DivisionOrder(
          'do-1',
          'org-456',
          'well-789',
          'partner-101',
          interest1,
          effectiveDate,
        );

        const divisionOrder2 = new DivisionOrder(
          'do-2',
          'org-456',
          'well-999',
          'partner-101',
          interest2,
          effectiveDate,
        );

        expect(divisionOrder1.overlapsWith(divisionOrder2)).toBe(false);
      });

      it('should return false for different partners', () => {
        const interest1 = new DecimalInterest(0.1);
        const interest2 = new DecimalInterest(0.2);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder1 = new DivisionOrder(
          'do-1',
          'org-456',
          'well-789',
          'partner-101',
          interest1,
          effectiveDate,
        );

        const divisionOrder2 = new DivisionOrder(
          'do-2',
          'org-456',
          'well-789',
          'partner-202',
          interest2,
          effectiveDate,
        );

        expect(divisionOrder1.overlapsWith(divisionOrder2)).toBe(false);
      });
    });
  });

  describe('factory methods', () => {
    describe('create', () => {
      it('should create division order with generated ID', () => {
        const interest = new DecimalInterest(0.125);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = DivisionOrder.create(
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
        );

        expect(divisionOrder.getId()).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
        expect(divisionOrder.getOrganizationId()).toBe('org-456');
        expect(divisionOrder.getWellId()).toBe('well-789');
        expect(divisionOrder.getPartnerId()).toBe('partner-101');
        expect(divisionOrder.getDecimalInterest()).toBe(interest);
        expect(divisionOrder.getEffectiveDate()).toEqual(effectiveDate);
      });

      it('should create division order with provided ID', () => {
        const interest = new DecimalInterest(0.125);
        const effectiveDate = new Date('2024-01-01');

        const divisionOrder = DivisionOrder.create(
          'org-456',
          'well-789',
          'partner-101',
          interest,
          effectiveDate,
          { id: 'custom-id-123' },
        );

        expect(divisionOrder.getId()).toBe('custom-id-123');
      });
    });

    describe('fromPersistence', () => {
      it('should create division order from persistence data', () => {
        const persistenceData: DivisionOrderPersistenceData = {
          id: 'do-123',
          organizationId: 'org-456',
          wellId: 'well-789',
          partnerId: 'partner-101',
          decimalInterest: '0.12500000',
          effectiveDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          isActive: false,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z'),
          version: 3,
        };

        const divisionOrder = DivisionOrder.fromPersistence(persistenceData);

        expect(divisionOrder.getId()).toBe('do-123');
        expect(divisionOrder.getOrganizationId()).toBe('org-456');
        expect(divisionOrder.getWellId()).toBe('well-789');
        expect(divisionOrder.getPartnerId()).toBe('partner-101');
        expect(divisionOrder.getDecimalInterest().getValue()).toBe(0.125);
        expect(divisionOrder.getEffectiveDate()).toEqual(
          new Date('2024-01-01'),
        );
        expect(divisionOrder.getEndDate()).toEqual(new Date('2024-12-31'));
        expect(divisionOrder.getIsActive()).toBe(false);
        expect(divisionOrder.getVersion()).toBe(3);
        expect(divisionOrder.getDomainEvents()).toHaveLength(0); // Should clear creation event
      });
    });
  });

  describe('persistence', () => {
    it('should convert to persistence format correctly', () => {
      const interest = new DecimalInterest(0.125);
      const effectiveDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const createdAt = new Date('2024-01-01T10:00:00Z');
      const updatedAt = new Date('2024-01-15T10:00:00Z');

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        interest,
        effectiveDate,
        { endDate, isActive: false },
      );

      // Manually set timestamps for testing
      (divisionOrder as any).createdAt = createdAt;
      (divisionOrder as any).updatedAt = updatedAt;
      (divisionOrder as any).version = 2;

      const persistence = divisionOrder.toPersistence();

      expect(persistence).toEqual({
        id: 'do-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        partnerId: 'partner-101',
        decimalInterest: '0.12500000',
        effectiveDate,
        endDate,
        isActive: false,
        createdAt,
        updatedAt,
        version: 2,
      });
    });
  });

  describe('domain events management', () => {
    it('should collect domain events', () => {
      const interest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        interest,
        effectiveDate,
        { isActive: false }, // Start inactive
      );

      expect(divisionOrder.getDomainEvents()).toHaveLength(1);

      divisionOrder.updateDecimalInterest(new DecimalInterest(0.15), 'user-1');
      divisionOrder.activate('user-2');

      expect(divisionOrder.getDomainEvents()).toHaveLength(3);
    });

    it('should clear domain events', () => {
      const interest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        interest,
        effectiveDate,
      );

      expect(divisionOrder.getDomainEvents()).toHaveLength(1);

      divisionOrder.clearDomainEvents();

      expect(divisionOrder.getDomainEvents()).toHaveLength(0);
    });

    it('should return copy of domain events array', () => {
      const interest = new DecimalInterest(0.1);
      const effectiveDate = new Date('2024-01-01');

      const divisionOrder = new DivisionOrder(
        'do-123',
        'org-456',
        'well-789',
        'partner-101',
        interest,
        effectiveDate,
      );

      const events = divisionOrder.getDomainEvents();
      events.push({} as any); // Try to modify the returned array

      expect(divisionOrder.getDomainEvents()).toHaveLength(1); // Should still be 1
    });
  });
});
