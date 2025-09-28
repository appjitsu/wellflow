import { GetRegulatoryReportStatusQuery } from '../get-regulatory-report-status.query';

describe('GetRegulatoryReportStatusQuery', () => {
  let query: GetRegulatoryReportStatusQuery;

  beforeEach(() => {
    query = new GetRegulatoryReportStatusQuery('test-report-id');
  });

  it('should be defined', () => {
    expect(query).toBeDefined();
  });

  it('should have correct properties', () => {
    expect(query.reportId).toBe('test-report-id');
  });
});
