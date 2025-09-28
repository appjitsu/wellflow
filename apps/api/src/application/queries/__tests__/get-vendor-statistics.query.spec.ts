import { GetVendorStatisticsQuery } from '../get-vendor-statistics.query';

describe('GetVendorStatisticsQuery', () => {
  it('should create query with organizationId', () => {
    const organizationId = 'test-org-id';
    const query = new GetVendorStatisticsQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
  });

  it('should be an instance of GetVendorStatisticsQuery', () => {
    const query = new GetVendorStatisticsQuery('test');
    expect(query).toBeInstanceOf(GetVendorStatisticsQuery);
  });
});
