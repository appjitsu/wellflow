import { CompleteMaintenanceScheduleCommand } from './complete-maintenance-schedule.command';

describe('CompleteMaintenanceScheduleCommand', () => {
  const validId = 'schedule-123';

  describe('constructor', () => {
    it('should create a command with id', () => {
      const command = new CompleteMaintenanceScheduleCommand(validId);

      expect(command.id).toBe(validId);
    });
  });

  describe('properties', () => {
    it('should have readonly id property', () => {
      const command = new CompleteMaintenanceScheduleCommand(validId);

      expect(command.id).toBeDefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent id value', () => {
      const command = new CompleteMaintenanceScheduleCommand(validId);

      const id1 = command.id;
      const id2 = command.id;

      expect(id1).toBe(id2);
    });
  });
});
