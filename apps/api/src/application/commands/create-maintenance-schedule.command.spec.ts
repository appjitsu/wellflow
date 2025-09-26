import { CreateMaintenanceScheduleCommand } from './create-maintenance-schedule.command';
import { CreateMaintenanceScheduleDto } from '../dtos/create-maintenance-schedule.dto';

describe('CreateMaintenanceScheduleCommand', () => {
  const validDto: CreateMaintenanceScheduleDto = {
    id: 'schedule-123',
    organizationId: 'org-456',
    equipmentId: 'equipment-789',
    vendorId: 'vendor-101',
    maintenanceType: 'preventive',
    scheduleDate: '2024-02-15',
    workOrderNumber: 'WO-2024-001',
    status: 'scheduled',
    estimatedCost: 2500,
    actualCost: 2200,
    downtimeHours: 4,
    notes: 'Regular preventive maintenance check',
  };

  describe('constructor', () => {
    it('should create a command with a DTO', () => {
      const command = new CreateMaintenanceScheduleCommand(validDto);

      expect(command.dto).toBe(validDto);
      expect(command.dto.id).toBe('schedule-123');
      expect(command.dto.organizationId).toBe('org-456');
      expect(command.dto.equipmentId).toBe('equipment-789');
    });

    it('should create a command with minimal DTO', () => {
      const minimalDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-123',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
      };

      const command = new CreateMaintenanceScheduleCommand(minimalDto);

      expect(command.dto).toBe(minimalDto);
      expect(command.dto.id).toBe('schedule-123');
      expect(command.dto.organizationId).toBe('org-456');
      expect(command.dto.equipmentId).toBe('equipment-789');
      expect(command.dto.vendorId).toBeUndefined();
      expect(command.dto.maintenanceType).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('should have readonly dto property', () => {
      const command = new CreateMaintenanceScheduleCommand(validDto);

      expect(command.dto).toBeDefined();
      expect(command.dto).toBeInstanceOf(Object);
    });

    it('should maintain object reference to DTO', () => {
      const command = new CreateMaintenanceScheduleCommand(validDto);

      expect(command.dto).toBe(validDto);
      expect(command.dto.id).toBe(validDto.id);
      expect(command.dto.organizationId).toBe(validDto.organizationId);
    });
  });

  describe('DTO structure', () => {
    it('should handle all DTO properties', () => {
      const command = new CreateMaintenanceScheduleCommand(validDto);

      expect(command.dto.id).toBe('schedule-123');
      expect(command.dto.organizationId).toBe('org-456');
      expect(command.dto.equipmentId).toBe('equipment-789');
      expect(command.dto.vendorId).toBe('vendor-101');
      expect(command.dto.maintenanceType).toBe('preventive');
      expect(command.dto.scheduleDate).toBe('2024-02-15');
      expect(command.dto.workOrderNumber).toBe('WO-2024-001');
      expect(command.dto.status).toBe('scheduled');
      expect(command.dto.estimatedCost).toBe(2500);
      expect(command.dto.actualCost).toBe(2200);
      expect(command.dto.downtimeHours).toBe(4);
      expect(command.dto.notes).toBe('Regular preventive maintenance check');
    });

    it('should handle undefined optional properties', () => {
      const dtoWithUndefined: CreateMaintenanceScheduleDto = {
        id: 'schedule-123',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        vendorId: undefined,
        maintenanceType: undefined,
        scheduleDate: undefined,
        workOrderNumber: undefined,
        status: undefined,
        estimatedCost: undefined,
        actualCost: undefined,
        downtimeHours: undefined,
        notes: undefined,
      };

      const command = new CreateMaintenanceScheduleCommand(dtoWithUndefined);

      expect(command.dto.vendorId).toBeUndefined();
      expect(command.dto.maintenanceType).toBeUndefined();
      expect(command.dto.scheduleDate).toBeUndefined();
      expect(command.dto.workOrderNumber).toBeUndefined();
      expect(command.dto.status).toBeUndefined();
      expect(command.dto.estimatedCost).toBeUndefined();
      expect(command.dto.actualCost).toBeUndefined();
      expect(command.dto.downtimeHours).toBeUndefined();
      expect(command.dto.notes).toBeUndefined();
    });
  });

  describe('maintenance types', () => {
    it('should accept valid maintenance types', () => {
      const preventiveDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-1',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        maintenanceType: 'preventive',
      };

      const inspectionDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-2',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        maintenanceType: 'inspection',
      };

      const repairDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-3',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        maintenanceType: 'repair',
      };

      const preventiveCommand = new CreateMaintenanceScheduleCommand(
        preventiveDto,
      );
      const inspectionCommand = new CreateMaintenanceScheduleCommand(
        inspectionDto,
      );
      const repairCommand = new CreateMaintenanceScheduleCommand(repairDto);

      expect(preventiveCommand.dto.maintenanceType).toBe('preventive');
      expect(inspectionCommand.dto.maintenanceType).toBe('inspection');
      expect(repairCommand.dto.maintenanceType).toBe('repair');
    });
  });

  describe('status values', () => {
    it('should accept valid status values', () => {
      const scheduledDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-1',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        status: 'scheduled',
      };

      const inProgressDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-2',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        status: 'in_progress',
      };

      const completedDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-3',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        status: 'completed',
      };

      const cancelledDto: CreateMaintenanceScheduleDto = {
        id: 'schedule-4',
        organizationId: 'org-456',
        equipmentId: 'equipment-789',
        status: 'cancelled',
      };

      const scheduledCommand = new CreateMaintenanceScheduleCommand(
        scheduledDto,
      );
      const inProgressCommand = new CreateMaintenanceScheduleCommand(
        inProgressDto,
      );
      const completedCommand = new CreateMaintenanceScheduleCommand(
        completedDto,
      );
      const cancelledCommand = new CreateMaintenanceScheduleCommand(
        cancelledDto,
      );

      expect(scheduledCommand.dto.status).toBe('scheduled');
      expect(inProgressCommand.dto.status).toBe('in_progress');
      expect(completedCommand.dto.status).toBe('completed');
      expect(cancelledCommand.dto.status).toBe('cancelled');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent DTO reference', () => {
      const command = new CreateMaintenanceScheduleCommand(validDto);

      const dto1 = command.dto;
      const dto2 = command.dto;

      expect(dto1).toBe(dto2);
      expect(dto1.id).toBe(dto2.id);
    });
  });
});
