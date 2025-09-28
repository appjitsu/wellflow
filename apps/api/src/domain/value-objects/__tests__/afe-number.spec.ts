import { AfeNumber } from '../afe-number';

describe('AfeNumber Value Object', () => {
  describe('constructor', () => {
    it('should create valid AFE number with standard format', () => {
      const afeNumber = new AfeNumber('AFE-2024-0001');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
      expect(afeNumber.getYear()).toBe('2024');
      expect(afeNumber.getSequentialNumber()).toBe('0001');
    });

    it('should format AFE number without hyphens', () => {
      const afeNumber = new AfeNumber('AFE20240001');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
      expect(afeNumber.getYear()).toBe('2024');
      expect(afeNumber.getSequentialNumber()).toBe('0001');
    });

    it('should handle mixed format with spaces', () => {
      const afeNumber = new AfeNumber(' AFE 2024 0001 ');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
    });

    it('should pad sequential number with zeros', () => {
      const afeNumber = new AfeNumber('AFE-2024-1');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
      expect(afeNumber.getSequentialNumber()).toBe('0001');
    });

    it('should handle large sequential numbers', () => {
      const afeNumber = new AfeNumber('AFE-2024-9999');

      expect(afeNumber.getValue()).toBe('AFE-2024-9999');
      expect(afeNumber.getSequentialNumber()).toBe('9999');
    });
  });

  describe('validation', () => {
    it('should reject empty AFE number', () => {
      expect(() => new AfeNumber('')).toThrow('AFE number cannot be empty');
    });

    it('should reject invalid format', () => {
      expect(() => new AfeNumber('INVALID-FORMAT')).toThrow(
        'Invalid AFE number format. Expected format: AFE-YYYY-NNNN (e.g., AFE-2024-0001)',
      );
    });

    it('should reject invalid year range', () => {
      expect(() => new AfeNumber('AFE-1800-0001')).toThrow(
        'Invalid year in AFE number. Year must be between 1900 and',
      );

      const futureYear = new Date().getFullYear() + 20;
      expect(() => new AfeNumber(`AFE-${futureYear}-0001`)).toThrow(
        'Invalid year in AFE number. Year must be between 1900 and',
      );
    });

    it('should reject zero sequential number', () => {
      expect(() => new AfeNumber('AFE-2024-0000')).toThrow(
        'Sequential number in AFE number cannot be zero',
      );
    });

    it('should accept current year', () => {
      const currentYear = new Date().getFullYear();
      const afeNumber = new AfeNumber(`AFE-${currentYear}-0001`);

      expect(afeNumber.getYear()).toBe(currentYear.toString());
    });

    it('should accept future years within limit', () => {
      const futureYear = new Date().getFullYear() + 5;
      const afeNumber = new AfeNumber(`AFE-${futureYear}-0001`);

      expect(afeNumber.getYear()).toBe(futureYear.toString());
    });
  });

  describe('equality', () => {
    it('should be equal for same AFE numbers', () => {
      const afe1 = new AfeNumber('AFE-2024-0001');
      const afe2 = new AfeNumber('AFE-2024-0001');

      expect(afe1.equals(afe2)).toBe(true);
    });

    it('should be equal regardless of input format', () => {
      const afe1 = new AfeNumber('AFE-2024-0001');
      const afe2 = new AfeNumber('AFE20240001');

      expect(afe1.equals(afe2)).toBe(true);
    });

    it('should not be equal for different AFE numbers', () => {
      const afe1 = new AfeNumber('AFE-2024-0001');
      const afe2 = new AfeNumber('AFE-2024-0002');

      expect(afe1.equals(afe2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted AFE number string', () => {
      const afeNumber = new AfeNumber('AFE-2024-0001');

      expect(afeNumber.toString()).toBe('AFE-2024-0001');
    });
  });

  describe('static factory methods', () => {
    it('should generate next AFE number', () => {
      const nextAfe = AfeNumber.generateNext(2024, 5);

      expect(nextAfe.getValue()).toBe('AFE-2024-0006');
      expect(nextAfe.getYear()).toBe('2024');
      expect(nextAfe.getSequentialNumber()).toBe('0006');
    });

    it('should create AFE number for current year', () => {
      const currentYear = new Date().getFullYear();
      const afeNumber = AfeNumber.forCurrentYear(123);

      expect(afeNumber.getYear()).toBe(currentYear.toString());
      expect(afeNumber.getSequentialNumber()).toBe('0123');
    });

    it('should parse AFE number from string', () => {
      const afeNumber = AfeNumber.parse('AFE-2024-0001');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
    });

    it('should handle large sequential numbers in generation', () => {
      const nextAfe = AfeNumber.generateNext(2024, 9998);

      expect(nextAfe.getValue()).toBe('AFE-2024-9999');
    });
  });

  describe('edge cases', () => {
    it('should handle lowercase input', () => {
      const afeNumber = new AfeNumber('afe-2024-0001');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
    });

    it('should handle mixed case input', () => {
      const afeNumber = new AfeNumber('Afe-2024-0001');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
    });

    it('should handle extra spaces', () => {
      const afeNumber = new AfeNumber('  AFE - 2024 - 0001  ');

      expect(afeNumber.getValue()).toBe('AFE-2024-0001');
    });
  });
});
