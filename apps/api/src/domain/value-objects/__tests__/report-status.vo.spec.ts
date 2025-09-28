import { ReportStatus } from '../report-status.vo';

describe('ReportStatus', () => {
  it('should create a valid report status', () => {
    const status = ReportStatus.DRAFT;
    expect(status).toBeDefined();
    expect(status.value).toBe('draft');
  });

  it('should create status from string', () => {
    const status = ReportStatus.fromString('approved');
    expect(status).toBe(ReportStatus.APPROVED);
  });
});
