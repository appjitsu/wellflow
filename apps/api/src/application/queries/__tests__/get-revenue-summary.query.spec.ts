import { GetRevenueSummaryQuery } from '../get-revenue-summary.query';

describe('GetRevenueSummaryQuery', () => {
  it('should create query with organizationId and summaryType', () => {
    const organizationId = 'test-org-id';
    const summaryType = 'well' as const;
    const query = new GetRevenueSummaryQuery(organizationId, summaryType);
    expect(query.organizationId).toBe(organizationId);
    expect(query.summaryType).toBe(summaryType);
    expect(query.targetId).toBeUndefined();
    expect(query.startMonth).toBeUndefined();
    expect(query.endMonth).toBeUndefined();
    expect(query.productionMonth).toBeUndefined();
  });

  it('should create query with targetId', () => {
    const organizationId = 'test-org-id';
    const summaryType = 'partner' as const;
    const targetId = 'partner-123';
    const query = new GetRevenueSummaryQuery(
      organizationId,
      summaryType,
      targetId,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.summaryType).toBe(summaryType);
    expect(query.targetId).toBe(targetId);
  });

  it('should create query with date parameters', () => {
    const organizationId = 'test-org-id';
    const summaryType = 'monthly' as const;
    const startMonth = '2023-01';
    const endMonth = '2023-12';
    const productionMonth = '2023-06';
    const query = new GetRevenueSummaryQuery(
      organizationId,
      summaryType,
      undefined,
      startMonth,
      endMonth,
      productionMonth,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.summaryType).toBe(summaryType);
    expect(query.startMonth).toBe(startMonth);
    expect(query.endMonth).toBe(endMonth);
    expect(query.productionMonth).toBe(productionMonth);
  });

  it('should be an instance of GetRevenueSummaryQuery', () => {
    const query = new GetRevenueSummaryQuery('org', 'well');
    expect(query).toBeInstanceOf(GetRevenueSummaryQuery);
  });
});
