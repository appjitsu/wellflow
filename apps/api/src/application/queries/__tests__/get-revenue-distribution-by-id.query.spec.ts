import { GetRevenueDistributionByIdQuery } from '../get-revenue-distribution-by-id.query';

describe('GetRevenueDistributionByIdQuery', () => {
  it('should create query with revenueDistributionId', () => {
    const revenueDistributionId = 'test-revenue-id';
    const query = new GetRevenueDistributionByIdQuery(revenueDistributionId);
    expect(query.revenueDistributionId).toBe(revenueDistributionId);
  });

  it('should be an instance of GetRevenueDistributionByIdQuery', () => {
    const query = new GetRevenueDistributionByIdQuery('test');
    expect(query).toBeInstanceOf(GetRevenueDistributionByIdQuery);
  });
});
