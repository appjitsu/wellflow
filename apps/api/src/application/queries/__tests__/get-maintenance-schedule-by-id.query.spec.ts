import { GetMaintenanceScheduleByIdQuery } from '../get-maintenance-schedule-by-id.query';

describe('GetMaintenanceScheduleByIdQuery', () => {
  it('should create query with id', () => {
    const id = 'test-id';
    const query = new GetMaintenanceScheduleByIdQuery(id);
    expect(query.id).toBe(id);
  });

  it('should be an instance of GetMaintenanceScheduleByIdQuery', () => {
    const query = new GetMaintenanceScheduleByIdQuery('test');
    expect(query).toBeInstanceOf(GetMaintenanceScheduleByIdQuery);
  });
});
