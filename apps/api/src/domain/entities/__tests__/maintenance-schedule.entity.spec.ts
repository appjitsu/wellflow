import {
  MaintenanceSchedule,
  MaintenanceType,
  MaintenanceStatus,
} from '../maintenance-schedule.entity';

describe('MaintenanceSchedule Entity', () => {
  const validProps = {
    id: 'maintenance-123',
    organizationId: 'org-456',
    equipmentId: 'equipment-789',
    vendorId: 'vendor-101',
    maintenanceType: 'preventive' as MaintenanceType,
    scheduleDate: new Date('2024-03-01'),
    workOrderNumber: 'WO-2024-001',
    status: 'scheduled' as MaintenanceStatus,
    estimatedCost: 2500.0,
    actualCost: 2200.0,
    downtimeHours: 4.5,
    notes: 'Regular preventive maintenance check',
  };

  describe('Constructor', () => {
    it('should create maintenance schedule with required fields', () => {
      const minimalProps = {
        id: 'maintenance-123',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
      };

      const schedule = new MaintenanceSchedule(minimalProps);

      expect(schedule.getId()).toBe('maintenance-123');
      expect(schedule.getOrganizationId()).toBe('org-456');
      expect(schedule.getEquipmentId()).toBe('equipment-789');
      expect(schedule.getStatus()).toBe('scheduled'); // default status
    });

    it('should create maintenance schedule with all optional fields', () => {
      const schedule = new MaintenanceSchedule(validProps);

      expect(schedule.getId()).toBe('maintenance-123');
      expect(schedule.getOrganizationId()).toBe('org-456');
      expect(schedule.getEquipmentId()).toBe('equipment-789');
      expect(schedule.getVendorId()).toBe('vendor-101');
      expect(schedule.getStatus()).toBe('scheduled');
    });

    it('should validate maintenance type', () => {
      expect(
        () =>
          new MaintenanceSchedule({
            ...validProps,
            maintenanceType: 'invalid' as MaintenanceType,
          }),
      ).toThrow('Invalid maintenance type: invalid');
    });

    it('should validate maintenance status', () => {
      expect(
        () =>
          new MaintenanceSchedule({
            ...validProps,
            status: 'invalid' as MaintenanceStatus,
          }),
      ).toThrow('Invalid maintenance status: invalid');
    });

    it('should accept valid maintenance types', () => {
      const validTypes: MaintenanceType[] = [
        'preventive',
        'inspection',
        'repair',
      ];

      validTypes.forEach((type) => {
        expect(
          () =>
            new MaintenanceSchedule({
              ...validProps,
              maintenanceType: type,
            }),
        ).not.toThrow();
      });
    });

    it('should accept valid maintenance statuses', () => {
      const validStatuses: MaintenanceStatus[] = [
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
      ];

      validStatuses.forEach((status) => {
        expect(
          () =>
            new MaintenanceSchedule({
              ...validProps,
              status: status,
            }),
        ).not.toThrow();
      });
    });

    it('should allow undefined maintenance type and status', () => {
      const propsWithoutEnums = {
        id: 'maintenance-123',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
      };

      expect(() => new MaintenanceSchedule(propsWithoutEnums)).not.toThrow();
    });
  });

  describe('Getters', () => {
    let schedule: MaintenanceSchedule;

    beforeEach(() => {
      schedule = new MaintenanceSchedule(validProps);
    });

    it('should return correct id', () => {
      expect(schedule.getId()).toBe('maintenance-123');
    });

    it('should return correct organizationId', () => {
      expect(schedule.getOrganizationId()).toBe('org-456');
    });

    it('should return correct equipmentId', () => {
      expect(schedule.getEquipmentId()).toBe('equipment-789');
    });

    it('should return correct vendorId', () => {
      expect(schedule.getVendorId()).toBe('vendor-101');
    });

    it('should return correct status', () => {
      expect(schedule.getStatus()).toBe('scheduled');
    });

    it('should return default status when not provided', () => {
      const minimalSchedule = new MaintenanceSchedule({
        id: 'maintenance-123',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
      });

      expect(minimalSchedule.getStatus()).toBe('scheduled');
    });

    it('should return undefined for optional fields when not set', () => {
      const minimalSchedule = new MaintenanceSchedule({
        id: 'maintenance-123',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
      });

      expect(minimalSchedule.getVendorId()).toBeUndefined();
    });
  });

  describe('Type Definitions', () => {
    it('should define MaintenanceType values', () => {
      const types: MaintenanceType[] = ['preventive', 'inspection', 'repair'];

      types.forEach((type) => {
        expect(['preventive', 'inspection', 'repair']).toContain(type);
      });
    });

    it('should define MaintenanceStatus values', () => {
      const statuses: MaintenanceStatus[] = [
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
      ];

      statuses.forEach((status) => {
        expect([
          'scheduled',
          'in_progress',
          'completed',
          'cancelled',
        ]).toContain(status);
      });
    });
  });

  describe('Validation', () => {
    it('should reject invalid maintenance types', () => {
      const invalidTypes = ['emergency', 'breakdown', 'upgrade'];

      invalidTypes.forEach((invalidType) => {
        expect(
          () =>
            new MaintenanceSchedule({
              ...validProps,
              maintenanceType: invalidType as MaintenanceType,
            }),
        ).toThrow(`Invalid maintenance type: ${invalidType}`);
      });
    });

    it('should reject invalid maintenance statuses', () => {
      const invalidStatuses = ['pending', 'overdue', 'failed'];

      invalidStatuses.forEach((invalidStatus) => {
        expect(
          () =>
            new MaintenanceSchedule({
              ...validProps,
              status: invalidStatus as MaintenanceStatus,
            }),
        ).toThrow(`Invalid maintenance status: ${invalidStatus}`);
      });
    });

    it('should accept all valid enum combinations', () => {
      const validTypes: MaintenanceType[] = [
        'preventive',
        'inspection',
        'repair',
      ];
      const validStatuses: MaintenanceStatus[] = [
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
      ];

      validTypes.forEach((type) => {
        validStatuses.forEach((status) => {
          expect(
            () =>
              new MaintenanceSchedule({
                ...validProps,
                maintenanceType: type,
                status: status,
              }),
          ).not.toThrow();
        });
      });
    });
  });
});
