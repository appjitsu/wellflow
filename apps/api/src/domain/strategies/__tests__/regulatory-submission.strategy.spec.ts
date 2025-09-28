import {
  EPARegulatorySubmissionStrategy,
  OSHARegulatorySubmissionStrategy,
  StateRegulatorySubmissionStrategy,
} from '../regulatory-submission.strategy';

describe('RegulatorySubmissionStrategies', () => {
  describe('EPARegulatorySubmissionStrategy', () => {
    let strategy: EPARegulatorySubmissionStrategy;

    beforeEach(() => {
      strategy = new EPARegulatorySubmissionStrategy();
    });

    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should return EPA as agency code', () => {
      expect(strategy.getAgencyCode()).toBe('EPA');
    });

    it('should handle EPA agency codes', () => {
      expect(strategy.canHandle('EPA')).toBe(true);
      expect(strategy.canHandle('EPA-AIR')).toBe(true);
      expect(strategy.canHandle('OSHA')).toBe(false);
    });

    it('should return required fields', () => {
      const fields = strategy.getRequiredFields();
      expect(fields).toContain('facilityId');
      expect(fields).toContain('reportingPeriodStart');
    });

    it('should return supported formats', () => {
      const formats = strategy.getSupportedFormats();
      expect(formats).toContain('pdf');
      expect(formats).toContain('xml');
    });
  });

  describe('OSHARegulatorySubmissionStrategy', () => {
    let strategy: OSHARegulatorySubmissionStrategy;

    beforeEach(() => {
      strategy = new OSHARegulatorySubmissionStrategy();
    });

    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should return OSHA as agency code', () => {
      expect(strategy.getAgencyCode()).toBe('OSHA');
    });

    it('should handle OSHA agency codes', () => {
      expect(strategy.canHandle('OSHA')).toBe(true);
      expect(strategy.canHandle('OSHA-300')).toBe(true);
      expect(strategy.canHandle('EPA')).toBe(false);
    });
  });

  describe('StateRegulatorySubmissionStrategy', () => {
    let strategy: StateRegulatorySubmissionStrategy;

    beforeEach(() => {
      strategy = new StateRegulatorySubmissionStrategy('TX');
    });

    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should return STATE-TX as agency code', () => {
      expect(strategy.getAgencyCode()).toBe('STATE-TX');
    });

    it('should handle TX state agency codes', () => {
      expect(strategy.canHandle('STATE-TX')).toBe(true);
      expect(strategy.canHandle('STATE-CA')).toBe(false);
    });
  });
});
