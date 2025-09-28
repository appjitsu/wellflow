import { GetRevenueDistributionsByWellQuery } from '../get-revenue-distributions-by-well.query';

describe('GetRevenueDistributionsByWellQuery', () => {
  it('should create query with wellId and no optional parameters', () => {
    const wellId = 'test-well-id';
    const query = new GetRevenueDistributionsByWellQuery(wellId);
    expect(query.wellId).toBe(wellId);
    expect(query.productionMonth).toBeUndefined();
    expect(query.startMonth).toBeUndefined();
    expect(query.endMonth).toBeUndefined();
  });

  it('should create query with productionMonth', () => {
    const wellId = 'test-well-id';
    const productionMonth = '2023-06';
    const query = new GetRevenueDistributionsByWellQuery(
      wellId,
      productionMonth,
    );
    expect(query.wellId).toBe(wellId);
    expect(query.productionMonth).toBe(productionMonth);
  });

  it('should create query with startMonth and endMonth', () => {
    const wellId = 'test-well-id';
    const startMonth = '2023-01';
    const endMonth = '2023-12';
    const query = new GetRevenueDistributionsByWellQuery(
      wellId,
      undefined,
      startMonth,
      endMonth,
    );
    expect(query.wellId).toBe(wellId);
    expect(query.startMonth).toBe(startMonth);
    expect(query.endMonth).toBe(endMonth);
  });

  it('should be an instance of GetRevenueDistributionsByWellQuery', () => {
    const query = new GetRevenueDistributionsByWellQuery('well');
    expect(query).toBeInstanceOf(GetRevenueDistributionsByWellQuery);
  });
});
