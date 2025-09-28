import { GetDailyDrillingReportsByOrganizationQuery } from '../get-daily-drilling-reports-by-organization.query';

describe('GetDailyDrillingReportsByOrganizationQuery', () => {
  it('should create query with organizationId and no options', () => {
    const organizationId = 'test-org-id';
    const query = new GetDailyDrillingReportsByOrganizationQuery(
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
      wellId: 'well-123',
      fromDate: '2023-01-01',
      toDate: '2023-12-31',
    };
    const query = new GetDailyDrillingReportsByOrganizationQuery(
      organizationId,
      options,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.options).toEqual(options);
  });

  it('should be an instance of GetDailyDrillingReportsByOrganizationQuery', () => {
    const query = new GetDailyDrillingReportsByOrganizationQuery('org');
    expect(query).toBeInstanceOf(GetDailyDrillingReportsByOrganizationQuery);
  });
});
