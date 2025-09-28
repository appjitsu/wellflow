import { RegulatoryReportingModule } from '../regulatory-reporting.module';

describe('RegulatoryReportingModule', () => {
  it('should be defined', () => {
    expect(RegulatoryReportingModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof RegulatoryReportingModule).toBe('function');
  });

  it('should have a prototype', () => {
    expect(RegulatoryReportingModule.prototype).toBeDefined();
  });
});
