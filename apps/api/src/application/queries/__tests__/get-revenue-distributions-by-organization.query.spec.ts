import { GetRevenueDistributionsByOrganizationQuery } from '../get-revenue-distributions-by-organization.query';

describe('GetRevenueDistributionsByOrganizationQuery', () => {
  it('should create query with organizationId and default values', () => {
    const organizationId = 'test-org-id';
    const query = new GetRevenueDistributionsByOrganizationQuery(
      organizationId,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.filters).toBeUndefined();
  });

  it('should create query with custom page and limit', () => {
    const organizationId = 'test-org-id';
    const page = 3;
    const limit = 25;
    const query = new GetRevenueDistributionsByOrganizationQuery(
      organizationId,
      page,
      limit,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(page);
    expect(query.limit).toBe(limit);
  });

  it('should create query with filters', () => {
    const organizationId = 'test-org-id';
    const filters = {
      wellId: 'well-123',
      partnerId: 'partner-456',
      productionMonth: '2023-06',
      startMonth: '2023-01',
      endMonth: '2023-12',
      isPaid: true,
    };
    const query = new GetRevenueDistributionsByOrganizationQuery(
      organizationId,
      1,
      10,
      filters,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toEqual(filters);
  });

  it('should be an instance of GetRevenueDistributionsByOrganizationQuery', () => {
    const query = new GetRevenueDistributionsByOrganizationQuery('test');
    expect(query).toBeInstanceOf(GetRevenueDistributionsByOrganizationQuery);
  });
});
