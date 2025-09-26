import { Well } from './well.entity';
import { ApiNumber } from '../value-objects/api-number';
import { Location } from '../value-objects/location';
import { Coordinates } from '../value-objects/coordinates';
import { WellStatus, WellType } from '../enums/well-status.enum';
import { WellStatusChangedEvent } from '../events/well-status-changed.event';

describe('Well', () => {
  const validApiNumber = new ApiNumber('42-123-45678');
  const validCoordinates = new Coordinates(40.7128, -74.006);
  const validLocation = new Location(validCoordinates, {
    address: '123 Main St',
    county: 'Test County',
    state: 'TX',
    country: 'USA',
  });

  describe('constructor', () => {
    it('should create well with required properties', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      expect(well.getId().getValue()).toBe('test-id');
      expect(well.getApiNumber()).toBe(validApiNumber);
      expect(well.getName()).toBe('Test Well');
      expect(well.getOperatorId()).toBe('operator-123');
      expect(well.getWellType()).toBe(WellType.OIL);
      expect(well.getLocation()).toBe(validLocation);
      expect(well.getStatus()).toBe(WellStatus.DRILLING); // Default status
      expect(well.getLeaseId()).toBeUndefined();
      expect(well.getSpudDate()).toBeUndefined();
      expect(well.getCompletionDate()).toBeUndefined();
      expect(well.getTotalDepth()).toBeUndefined();
      expect(well.getVersion()).toBe(1);
      expect(well.getCreatedAt()).toBeInstanceOf(Date);
      expect(well.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should create well with optional properties', () => {
      const spudDate = new Date('2024-01-01');
      const completionDate = new Date('2024-02-01');

      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        {
          leaseId: 'lease-123',
          status: WellStatus.PRODUCING,
          spudDate,
          completionDate,
          totalDepth: 5000,
        },
      );

      expect(well.getLeaseId()).toBe('lease-123');
      expect(well.getStatus()).toBe(WellStatus.PRODUCING);
      expect(well.getSpudDate()).toBe(spudDate);
      expect(well.getCompletionDate()).toBe(completionDate);
      expect(well.getTotalDepth()).toBe(5000);
    });

    it('should create well with different well types', () => {
      const gasWell = new Well(
        'gas-well',
        validApiNumber,
        'Gas Well',
        'operator-123',
        WellType.GAS,
        validLocation,
      );
      expect(gasWell.getWellType()).toBe(WellType.GAS);

      const injectionWell = new Well(
        'injection-well',
        validApiNumber,
        'Injection Well',
        'operator-123',
        WellType.INJECTION,
        validLocation,
      );
      expect(injectionWell.getWellType()).toBe(WellType.INJECTION);
    });
  });

  describe('updateStatus', () => {
    it('should update status and add domain event for valid transition', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PLANNED },
      );

      well.updateStatus(WellStatus.PERMITTED, 'user-123');

      expect(well.getStatus()).toBe(WellStatus.PERMITTED);
      expect(well.getVersion()).toBe(2);

      const events = well.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WellStatusChangedEvent);

      const event = events[0] as WellStatusChangedEvent;
      expect(event.wellId).toBe('test-id');
      expect(event.previousStatus).toBe(WellStatus.PLANNED);
      expect(event.newStatus).toBe(WellStatus.PERMITTED);
      expect(event.updatedBy).toBe('user-123');
    });

    it('should throw error for invalid status transition', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PLUGGED },
      );

      expect(() => well.updateStatus(WellStatus.PRODUCING, 'user-123')).toThrow(
        'Invalid status transition from PLUGGED to PRODUCING',
      );
    });

    it('should allow valid status transitions', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.DRILLING },
      );

      // Valid transition: DRILLING -> COMPLETED
      well.updateStatus(WellStatus.COMPLETED, 'user-123');
      expect(well.getStatus()).toBe(WellStatus.COMPLETED);

      // Valid transition: COMPLETED -> PRODUCING
      well.updateStatus(WellStatus.PRODUCING, 'user-123');
      expect(well.getStatus()).toBe(WellStatus.PRODUCING);
    });

    it('should handle UNKNOWN status transitions', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.UNKNOWN },
      );

      // UNKNOWN can transition to any status
      well.updateStatus(WellStatus.PRODUCING, 'user-123');
      expect(well.getStatus()).toBe(WellStatus.PRODUCING);
    });
  });

  describe('updateName', () => {
    it('should update well name', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Old Name',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      well.updateName('New Well Name');

      expect(well.getName()).toBe('New Well Name');
      expect(well.getVersion()).toBe(2);
    });

    it('should trim whitespace from name', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Old Name',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      well.updateName('  New Well Name  ');

      expect(well.getName()).toBe('New Well Name');
    });

    it('should throw error for empty name', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Old Name',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      expect(() => well.updateName('')).toThrow('Well name cannot be empty');
      expect(() => well.updateName('   ')).toThrow('Well name cannot be empty');
    });
  });

  describe('setSpudDate', () => {
    it('should set spud date', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      const spudDate = new Date('2024-01-01');
      well.setSpudDate(spudDate);

      expect(well.getSpudDate()).toBe(spudDate);
      expect(well.getVersion()).toBe(2);
    });

    it('should throw error for future spud date', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(() => well.setSpudDate(futureDate)).toThrow(
        'Spud date cannot be in the future',
      );
    });
  });

  describe('setCompletionDate', () => {
    it('should set completion date', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      const completionDate = new Date('2024-02-01');
      well.setCompletionDate(completionDate);

      expect(well.getCompletionDate()).toBe(completionDate);
      expect(well.getVersion()).toBe(2);
    });

    it('should throw error if completion date is before spud date', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { spudDate: new Date('2024-02-01') },
      );

      const earlierDate = new Date('2024-01-01');
      expect(() => well.setCompletionDate(earlierDate)).toThrow(
        'Completion date cannot be before spud date',
      );
    });

    it('should allow completion date after spud date', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { spudDate: new Date('2024-01-01') },
      );

      const laterDate = new Date('2024-02-01');
      well.setCompletionDate(laterDate);

      expect(well.getCompletionDate()).toBe(laterDate);
    });
  });

  describe('setTotalDepth', () => {
    it('should set total depth', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      well.setTotalDepth(5000);

      expect(well.getTotalDepth()).toBe(5000);
      expect(well.getVersion()).toBe(2);
    });

    it('should throw error for zero or negative depth', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
      );

      expect(() => well.setTotalDepth(0)).toThrow(
        'Total depth must be greater than 0',
      );
      expect(() => well.setTotalDepth(-100)).toThrow(
        'Total depth must be greater than 0',
      );
    });
  });

  describe('domain events', () => {
    it('should manage domain events', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PLANNED },
      );

      // Initially no events
      expect(well.getDomainEvents()).toHaveLength(0);

      // Update status to generate event
      well.updateStatus(WellStatus.PERMITTED, 'user-123');
      expect(well.getDomainEvents()).toHaveLength(1);

      // Clear events
      well.clearDomainEvents();
      expect(well.getDomainEvents()).toHaveLength(0);
    });

    it('should return copy of domain events', () => {
      const well = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PLANNED },
      );

      well.updateStatus(WellStatus.PERMITTED, 'user-123');
      const events1 = well.getDomainEvents();
      const events2 = well.getDomainEvents();

      expect(events1).not.toBe(events2); // Different array instances
      expect(events1).toEqual(events2); // Same content
    });
  });

  describe('fromPersistence', () => {
    it('should reconstruct well from persistence data', () => {
      const persistenceData = {
        id: 'persisted-id',
        apiNumber: '42-123-45678',
        name: 'Persisted Well',
        operatorId: 'operator-456',
        wellType: WellType.GAS,
        location: {
          coordinates: { latitude: 32.7767, longitude: -96.797 },
          address: '456 Oak St',
          county: 'Dallas County',
          state: 'TX',
          country: 'USA',
        },
        leaseId: 'lease-456',
        status: WellStatus.PRODUCING,
        spudDate: new Date('2023-06-01'),
        completionDate: new Date('2023-07-01'),
        totalDepth: 8000,
        createdAt: new Date('2023-05-01'),
        updatedAt: new Date('2023-07-15'),
        version: 5,
      };

      const well = Well.fromPersistence(persistenceData);

      expect(well.getId().getValue()).toBe('persisted-id');
      expect(well.getApiNumber().getValue()).toBe('42-123-45678');
      expect(well.getName()).toBe('Persisted Well');
      expect(well.getOperatorId()).toBe('operator-456');
      expect(well.getWellType()).toBe(WellType.GAS);
      expect(well.getLeaseId()).toBe('lease-456');
      expect(well.getStatus()).toBe(WellStatus.PRODUCING);
      expect(well.getSpudDate()).toEqual(new Date('2023-06-01'));
      expect(well.getCompletionDate()).toEqual(new Date('2023-07-01'));
      expect(well.getTotalDepth()).toBe(8000);
      expect(well.getCreatedAt()).toEqual(new Date('2023-05-01'));
      expect(well.getUpdatedAt()).toEqual(new Date('2023-07-15'));
      expect(well.getVersion()).toBe(5);
    });
  });

  describe('status transition validation', () => {
    it('should validate all status transitions correctly', () => {
      // Test PLANNED transitions
      const plannedWell = new Well(
        'test-id',
        validApiNumber,
        'Test Well',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PLANNED },
      );

      // Valid transitions from PLANNED
      expect(() =>
        plannedWell.updateStatus(WellStatus.PERMITTED, 'user'),
      ).not.toThrow();

      const plannedWell2 = new Well(
        'test-id-2',
        validApiNumber,
        'Test Well 2',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PLANNED },
      );
      expect(() =>
        plannedWell2.updateStatus(WellStatus.DRILLING, 'user'),
      ).not.toThrow();

      // Test PERMITTED transitions
      const permittedWell = new Well(
        'test-id-3',
        validApiNumber,
        'Test Well 3',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PERMITTED },
      );
      expect(() =>
        permittedWell.updateStatus(WellStatus.DRILLING, 'user'),
      ).not.toThrow();

      // Test terminal state (PLUGGED)
      const pluggedWell = new Well(
        'test-id-4',
        validApiNumber,
        'Test Well 4',
        'operator-123',
        WellType.OIL,
        validLocation,
        { status: WellStatus.PLUGGED },
      );
      expect(() =>
        pluggedWell.updateStatus(WellStatus.PRODUCING, 'user'),
      ).toThrow();
    });
  });
});
