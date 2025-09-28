import { MaintenanceScheduleCreatedEvent } from '../maintenance-schedule-created.event';

describe('MaintenanceScheduleCreatedEvent', () => {
  it('should be defined', () => {
    const event = new MaintenanceScheduleCreatedEvent(
      'id',
      'orgId',
      'equipId',
      'status',
    );
    expect(event).toBeDefined();
  });

  it('should have correct properties', () => {
    const event = new MaintenanceScheduleCreatedEvent(
      'id',
      'orgId',
      'equipId',
      'status',
    );
    expect(event.id).toBe('id');
    expect(event.organizationId).toBe('orgId');
    expect(event.equipmentId).toBe('equipId');
    expect(event.status).toBe('status');
  });
});
