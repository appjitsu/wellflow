import { GetMaintenanceSchedulesByOrganizationQuery } from '../get-maintenance-schedules-by-organization.query';

describe('GetMaintenanceSchedulesByOrganizationQuery', () => {
  it('should create query with organizationId and no options', () => {
    const organizationId = 'test-org-id';
    const query = new GetMaintenanceSchedulesByOrganizationQuery(
      organizationId,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.options).toBeUndefined();
  });

  it('should create query with options', () => {
    const organizationId = 'test-org-id';
    const options = {
      limit: 20,
      offset: 10,
      equipmentId: 'equip-123',
      status: 'scheduled' as const,
    };
    const query = new GetMaintenanceSchedulesByOrganizationQuery(
      organizationId,
      options,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.options).toEqual(options);
  });

  it('should be an instance of GetMaintenanceSchedulesByOrganizationQuery', () => {
    const query = new GetMaintenanceSchedulesByOrganizationQuery('org');
    expect(query).toBeInstanceOf(GetMaintenanceSchedulesByOrganizationQuery);
  });
});
