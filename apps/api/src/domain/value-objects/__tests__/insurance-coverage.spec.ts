import { InsuranceCoverage } from '../insurance-coverage';
import { InsuranceType } from '../../enums/vendor-status.enum';

describe('InsuranceCoverage', () => {
  it('should be defined', () => {
    const coverage = new InsuranceCoverage(
      InsuranceType.GENERAL_LIABILITY,
      'Test Carrier',
      'POL123',
      1000000,
      new Date('2025-12-31'),
    );
    expect(coverage).toBeDefined();
  });
});
