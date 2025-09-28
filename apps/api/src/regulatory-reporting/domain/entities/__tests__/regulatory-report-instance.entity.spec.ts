import { RegulatoryReportInstance } from '../regulatory-report-instance.entity';
import { Jurisdiction } from '../../value-objects/jurisdiction.vo';
import { Period } from '../../value-objects/period.vo';

describe('RegulatoryReportInstance', () => {
  let entity: RegulatoryReportInstance;
  const jurisdiction: Jurisdiction = 'TX';
  const period = new Period('2024-01');

  beforeEach(() => {
    entity = new RegulatoryReportInstance(
      'report-123',
      'org-123',
      jurisdiction,
      'PR',
      period,
      'draft',
      'user-123',
    );
  });

  it('should be defined', () => {
    expect(entity).toBeDefined();
  });

  it('should return correct id', () => {
    expect(entity.getId()).toBe('report-123');
  });

  it('should return correct organization id', () => {
    expect(entity.getOrganizationId()).toBe('org-123');
  });

  it('should return correct jurisdiction', () => {
    expect(entity.getJurisdiction()).toBe('TX');
  });

  it('should return correct report type', () => {
    expect(entity.getReportType()).toBe('PR');
  });

  it('should return correct period', () => {
    expect(entity.getPeriod()).toBe(period);
  });

  it('should return correct status', () => {
    expect(entity.getStatus()).toBe('draft');
  });

  it('should return correct created by user id', () => {
    expect(entity.getCreatedByUserId()).toBe('user-123');
  });
});
