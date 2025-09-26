import { DailyDrillingReport } from './daily-drilling-report.entity';

describe('DailyDrillingReport', () => {
  describe('constructor', () => {
    it('should create report with minimal required properties', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15'),
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
      expect(report.getOrganizationId()).toBe('org-456');
      expect(report.getWellId()).toBe('well-789');
      expect(report.getReportDate()).toEqual(new Date('2024-01-15'));
    });

    it('should create report with all optional properties', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15T10:00:00Z'),
        depthMd: 8500.5,
        depthTvd: 8200.3,
        rotatingHours: 12.5,
        nptHours: 2.0,
        dayCost: 15000.75,
        nextOperations: 'Continue drilling to 9000ft',
        notes: 'Good progress today, no issues reported',
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
      expect(report.getOrganizationId()).toBe('org-456');
      expect(report.getWellId()).toBe('well-789');
      expect(report.getReportDate()).toEqual(new Date('2024-01-15T10:00:00Z'));
    });

    it('should handle zero values for numeric fields', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15'),
        depthMd: 0,
        depthTvd: 0,
        rotatingHours: 0,
        nptHours: 0,
        dayCost: 0,
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
    });

    it('should handle negative values for numeric fields', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15'),
        depthMd: -100, // Possible for certain drilling scenarios
        depthTvd: -50,
        rotatingHours: -1, // Shouldn't happen but test edge case
        nptHours: -0.5,
        dayCost: -500, // Possible refund or adjustment
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
    });
  });

  describe('getters', () => {
    let report: DailyDrillingReport;

    beforeEach(() => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15T10:00:00Z'),
        depthMd: 8500.5,
        depthTvd: 8200.3,
        rotatingHours: 12.5,
        nptHours: 2.0,
        dayCost: 15000.75,
        nextOperations: 'Continue drilling to 9000ft',
        notes: 'Good progress today, no issues reported',
      };

      report = new DailyDrillingReport(props);
    });

    it('should return correct id', () => {
      expect(report.getId()).toBe('report-123');
    });

    it('should return correct organizationId', () => {
      expect(report.getOrganizationId()).toBe('org-456');
    });

    it('should return correct wellId', () => {
      expect(report.getWellId()).toBe('well-789');
    });

    it('should return correct reportDate', () => {
      expect(report.getReportDate()).toEqual(new Date('2024-01-15T10:00:00Z'));
    });
  });

  describe('edge cases', () => {
    it('should handle undefined optional properties', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15'),
        depthMd: undefined,
        depthTvd: undefined,
        rotatingHours: undefined,
        nptHours: undefined,
        dayCost: undefined,
        nextOperations: undefined,
        notes: undefined,
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
      expect(report.getOrganizationId()).toBe('org-456');
      expect(report.getWellId()).toBe('well-789');
      expect(report.getReportDate()).toEqual(new Date('2024-01-15'));
    });

    it('should handle empty strings for text fields', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15'),
        nextOperations: '',
        notes: '',
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
    });

    it('should handle very large numeric values', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15'),
        depthMd: 999999.99,
        depthTvd: 999999.99,
        rotatingHours: 999.99,
        nptHours: 999.99,
        dayCost: 999999999.99,
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
    });

    it('should handle very small decimal values', () => {
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: new Date('2024-01-15'),
        depthMd: 0.01,
        depthTvd: 0.01,
        rotatingHours: 0.01,
        nptHours: 0.01,
        dayCost: 0.01,
      };

      const report = new DailyDrillingReport(props);

      expect(report.getId()).toBe('report-123');
    });
  });

  describe('date handling', () => {
    it('should preserve exact report date', () => {
      const exactDate = new Date('2024-01-15T14:30:45.123Z');
      const props = {
        id: 'report-123',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: exactDate,
      };

      const report = new DailyDrillingReport(props);

      expect(report.getReportDate()).toEqual(exactDate);
      expect(report.getReportDate().getTime()).toBe(exactDate.getTime());
    });

    it('should handle different timezones', () => {
      const utcDate = new Date('2024-01-15T00:00:00.000Z');
      const estDate = new Date('2024-01-14T19:00:00.000Z'); // Same moment in EST

      const utcReport = new DailyDrillingReport({
        id: 'report-utc',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: utcDate,
      });

      const estReport = new DailyDrillingReport({
        id: 'report-est',
        organizationId: 'org-456',
        wellId: 'well-789',
        reportDate: estDate,
      });

      expect(utcReport.getReportDate()).toEqual(utcDate);
      expect(estReport.getReportDate()).toEqual(estDate);
    });
  });

  describe('drilling metrics validation', () => {
    it('should handle realistic drilling depths', () => {
      // Test various realistic drilling depths
      const depths = [1000, 5000, 10000, 15000, 25000, 35000];

      depths.forEach((depth, index) => {
        const props = {
          id: `report-${index}`,
          organizationId: 'org-456',
          wellId: 'well-789',
          reportDate: new Date('2024-01-15'),
          depthMd: depth,
          depthTvd: depth * 0.95, // TVD typically slightly less than MD
        };

        const report = new DailyDrillingReport(props);
        expect(report.getId()).toBe(`report-${index}`);
      });
    });

    it('should handle realistic operating hours', () => {
      // Test various realistic operating hours (0-24)
      const hours = [0, 6, 12, 18, 24, 8.5, 13.25];

      hours.forEach((hour, index) => {
        const props = {
          id: `report-${index}`,
          organizationId: 'org-456',
          wellId: 'well-789',
          reportDate: new Date('2024-01-15'),
          rotatingHours: hour,
          nptHours: 24 - hour, // Remaining time as NPT
        };

        const report = new DailyDrillingReport(props);
        expect(report.getId()).toBe(`report-${index}`);
      });
    });

    it('should handle realistic cost figures', () => {
      // Test various realistic daily costs
      const costs = [5000, 15000, 25000, 50000, 100000, 500000];

      costs.forEach((cost, index) => {
        const props = {
          id: `report-${index}`,
          organizationId: 'org-456',
          wellId: 'well-789',
          reportDate: new Date('2024-01-15'),
          dayCost: cost,
        };

        const report = new DailyDrillingReport(props);
        expect(report.getId()).toBe(`report-${index}`);
      });
    });
  });
});
