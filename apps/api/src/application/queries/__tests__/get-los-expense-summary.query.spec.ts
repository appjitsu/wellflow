import { GetLosExpenseSummaryQuery } from '../get-los-expense-summary.query';

describe('GetLosExpenseSummaryQuery', () => {
  it('should create query with all parameters', () => {
    const organizationId = 'test-org-id';
    const startYear = 2023;
    const startMonth = 1;
    const endYear = 2023;
    const endMonth = 12;
    const query = new GetLosExpenseSummaryQuery(
      organizationId,
      startYear,
      startMonth,
      endYear,
      endMonth,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.startYear).toBe(startYear);
    expect(query.startMonth).toBe(startMonth);
    expect(query.endYear).toBe(endYear);
    expect(query.endMonth).toBe(endMonth);
  });

  it('should be an instance of GetLosExpenseSummaryQuery', () => {
    const query = new GetLosExpenseSummaryQuery('org', 2023, 1, 2023, 12);
    expect(query).toBeInstanceOf(GetLosExpenseSummaryQuery);
  });
});
