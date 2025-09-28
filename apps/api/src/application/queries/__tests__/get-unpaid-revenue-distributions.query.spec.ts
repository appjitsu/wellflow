import { GetUnpaidRevenueDistributionsQuery } from '../get-unpaid-revenue-distributions.query';

describe('GetUnpaidRevenueDistributionsQuery', () => {
  it('should create query with organizationId and no optional parameters', () => {
    const organizationId = 'test-org-id';
    const query = new GetUnpaidRevenueDistributionsQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.wellId).toBeUndefined();
    expect(query.partnerId).toBeUndefined();
    expect(query.beforeMonth).toBeUndefined();
    expect(query.minimumAmount).toBeUndefined();
  });

  it('should create query with filters', () => {
    const organizationId = 'test-org-id';
    const wellId = 'well-123';
    const partnerId = 'partner-456';
    const beforeMonth = '2023-06';
    const minimumAmount = 1000;
    const query = new GetUnpaidRevenueDistributionsQuery(
      organizationId,
      wellId,
      partnerId,
      beforeMonth,
      minimumAmount,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.wellId).toBe(wellId);
    expect(query.partnerId).toBe(partnerId);
    expect(query.beforeMonth).toBe(beforeMonth);
    expect(query.minimumAmount).toBe(minimumAmount);
  });

  it('should be an instance of GetUnpaidRevenueDistributionsQuery', () => {
    const query = new GetUnpaidRevenueDistributionsQuery('org');
    expect(query).toBeInstanceOf(GetUnpaidRevenueDistributionsQuery);
  });
});
