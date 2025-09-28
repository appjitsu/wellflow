import { GetDailyDrillingReportByIdQuery } from '../get-daily-drilling-report-by-id.query';

describe('GetDailyDrillingReportByIdQuery', () => {
  it('should create query with id', () => {
    const id = 'test-id';
    const query = new GetDailyDrillingReportByIdQuery(id);
    expect(query.id).toBe(id);
  });

  it('should be an instance of GetDailyDrillingReportByIdQuery', () => {
    const query = new GetDailyDrillingReportByIdQuery('test');
    expect(query).toBeInstanceOf(GetDailyDrillingReportByIdQuery);
  });
});
