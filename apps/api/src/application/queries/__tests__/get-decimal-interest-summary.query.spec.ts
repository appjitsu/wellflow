import { GetDecimalInterestSummaryQuery } from '../get-decimal-interest-summary.query';

describe('GetDecimalInterestSummaryQuery', () => {
  it('should create query with wellId and no effectiveDate', () => {
    const wellId = 'test-well-id';
    const query = new GetDecimalInterestSummaryQuery(wellId);
    expect(query.wellId).toBe(wellId);
    expect(query.effectiveDate).toBeUndefined();
  });

  it('should create query with effectiveDate', () => {
    const wellId = 'test-well-id';
    const effectiveDate = new Date('2023-01-01');
    const query = new GetDecimalInterestSummaryQuery(wellId, effectiveDate);
    expect(query.wellId).toBe(wellId);
    expect(query.effectiveDate).toBe(effectiveDate);
  });

  it('should be an instance of GetDecimalInterestSummaryQuery', () => {
    const query = new GetDecimalInterestSummaryQuery('well');
    expect(query).toBeInstanceOf(GetDecimalInterestSummaryQuery);
  });
});
