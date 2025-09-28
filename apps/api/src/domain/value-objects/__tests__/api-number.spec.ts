import { ApiNumber } from '../api-number';

describe('ApiNumber', () => {
  describe('constructor', () => {
    it('should create valid API number', () => {
      const apiNumber = new ApiNumber('4212345678');
      expect(apiNumber.getValue()).toBe('42-123-45678');
    });

    it('should throw error for empty API number', () => {
      expect(() => new ApiNumber('')).toThrow('API Number cannot be empty');
    });

    it('should throw error for null API number', () => {
      expect(() => new ApiNumber(null as unknown as string)).toThrow(
        'API Number cannot be empty',
      );
    });

    it('should throw error for undefined API number', () => {
      expect(() => new ApiNumber(undefined as unknown as string)).toThrow(
        'API Number cannot be empty',
      );
    });

    it('should throw error for invalid format', () => {
      expect(() => new ApiNumber('invalid')).toThrow(
        'API Number must be exactly 10 digits',
      );
    });

    it('should throw error for too short API number', () => {
      expect(() => new ApiNumber('123')).toThrow(
        'API Number must be exactly 10 digits',
      );
    });

    it('should throw error for too long API number', () => {
      expect(() => new ApiNumber('12345678901')).toThrow(
        'API Number must be exactly 10 digits',
      );
    });
  });

  describe('equals', () => {
    it('should return true for equal API numbers', () => {
      const apiNumber1 = new ApiNumber('4212345678');
      const apiNumber2 = new ApiNumber('42-123-45678');
      expect(apiNumber1.equals(apiNumber2)).toBe(true);
    });

    it('should return false for different API numbers', () => {
      const apiNumber1 = new ApiNumber('4212345678');
      const apiNumber2 = new ApiNumber('4212345679');
      expect(apiNumber1.equals(apiNumber2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const apiNumber = new ApiNumber('4212345678');
      expect(apiNumber.equals(null as unknown as ApiNumber)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const apiNumber = new ApiNumber('4212345678');
      expect(apiNumber.toString()).toBe('42-123-45678');
    });
  });

  describe('validation', () => {
    it('should accept various valid formats and normalize them', () => {
      const validFormats = ['4212345678', '42-123-45678', '42 123 45678'];

      validFormats.forEach((format) => {
        const apiNumber = new ApiNumber(format);
        expect(apiNumber.getValue()).toBe('42-123-45678'); // All should normalize to this format
      });
    });

    it('should reject formats with dots and underscores', () => {
      const invalidFormats = ['42.123.45678', '42_123_45678'];

      invalidFormats.forEach((format) => {
        expect(() => new ApiNumber(format)).toThrow(
          'API Number must be exactly 10 digits',
        );
      });
    });

    it('should reject invalid characters', () => {
      const invalidFormats = [
        '42@12345678',
        '42#12345678',
        '42$12345678',
        '42%12345678',
        'abcd123456',
      ];

      invalidFormats.forEach((format) => {
        expect(() => new ApiNumber(format)).toThrow(
          'API Number must be exactly 10 digits',
        );
      });
    });

    it('should validate state codes', () => {
      // Valid state codes (1-56)
      const validStateCodes = ['01', '25', '42', '56'];
      validStateCodes.forEach((stateCode) => {
        const apiNumber = new ApiNumber(`${stateCode}12345678`);
        expect(apiNumber.getStateCode()).toBe(stateCode);
      });

      // Invalid state codes
      expect(() => new ApiNumber('0012345678')).toThrow(
        'Invalid state code in API Number',
      );
      expect(() => new ApiNumber('5712345678')).toThrow(
        'Invalid state code in API Number',
      );
      expect(() => new ApiNumber('9912345678')).toThrow(
        'Invalid state code in API Number',
      );
    });

    it('should handle edge cases for state code validation', () => {
      // Boundary values
      expect(() => new ApiNumber('0112345678')).not.toThrow(); // Minimum valid
      expect(() => new ApiNumber('5612345678')).not.toThrow(); // Maximum valid

      // Just outside boundaries
      expect(() => new ApiNumber('0012345678')).toThrow(
        'Invalid state code in API Number',
      );
      expect(() => new ApiNumber('5712345678')).toThrow(
        'Invalid state code in API Number',
      );
    });
  });

  describe('component extraction', () => {
    it('should extract state code correctly', () => {
      const apiNumber = new ApiNumber('4212345678');
      expect(apiNumber.getStateCode()).toBe('42');
    });

    it('should extract county code correctly', () => {
      const apiNumber = new ApiNumber('4212345678');
      expect(apiNumber.getCountyCode()).toBe('123');
    });

    it('should extract unique number correctly', () => {
      const apiNumber = new ApiNumber('4212345678');
      expect(apiNumber.getUniqueNumber()).toBe('45678');
    });

    it('should extract components from formatted input', () => {
      const apiNumber = new ApiNumber('42-123-45678');
      expect(apiNumber.getStateCode()).toBe('42');
      expect(apiNumber.getCountyCode()).toBe('123');
      expect(apiNumber.getUniqueNumber()).toBe('45678');
    });

    it('should extract components from space-separated input', () => {
      const apiNumber = new ApiNumber('42 123 45678');
      expect(apiNumber.getStateCode()).toBe('42');
      expect(apiNumber.getCountyCode()).toBe('123');
      expect(apiNumber.getUniqueNumber()).toBe('45678');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle whitespace-only input', () => {
      expect(() => new ApiNumber('   ')).toThrow(
        'API Number must be exactly 10 digits',
      );
    });

    it('should handle mixed valid and invalid characters', () => {
      expect(() => new ApiNumber('42-123-4567a')).toThrow(
        'API Number must be exactly 10 digits',
      );
      expect(() => new ApiNumber('4a-123-45678')).toThrow(
        'API Number must be exactly 10 digits',
      );
    });

    it('should handle numbers with leading zeros', () => {
      const apiNumber = new ApiNumber('0112345678');
      expect(apiNumber.getValue()).toBe('01-123-45678');
      expect(apiNumber.getStateCode()).toBe('01');
    });

    it('should handle complex formatting combinations', () => {
      const complexFormats = [
        '42- 123 -45678',
        '42 -123- 45678',
        ' 42 123 45678 ',
      ];

      complexFormats.forEach((format) => {
        const apiNumber = new ApiNumber(format);
        expect(apiNumber.getValue()).toBe('42-123-45678');
      });
    });
  });

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const apiNumber = new ApiNumber('4212345678');
      const originalValue = apiNumber.getValue();

      // Attempt to modify (should not be possible due to readonly)
      expect(apiNumber.getValue()).toBe(originalValue);
      expect(apiNumber.toString()).toBe(originalValue);
    });

    it('should return consistent values across multiple calls', () => {
      const apiNumber = new ApiNumber('4212345678');

      expect(apiNumber.getValue()).toBe(apiNumber.getValue());
      expect(apiNumber.getStateCode()).toBe(apiNumber.getStateCode());
      expect(apiNumber.getCountyCode()).toBe(apiNumber.getCountyCode());
      expect(apiNumber.getUniqueNumber()).toBe(apiNumber.getUniqueNumber());
    });
  });

  describe('real-world examples', () => {
    it('should handle common state codes', () => {
      const commonStates = [
        { code: '05', name: 'California' },
        { code: '42', name: 'Pennsylvania' },
        { code: '48', name: 'Texas' },
        { code: '40', name: 'Oklahoma' },
      ];

      commonStates.forEach((state) => {
        const apiNumber = new ApiNumber(`${state.code}12345678`);
        expect(apiNumber.getStateCode()).toBe(state.code);
        expect(apiNumber.getValue()).toBe(`${state.code}-123-45678`);
      });
    });

    it('should handle various county and unique number combinations', () => {
      const examples = [
        { input: '4200145678', expected: '42-001-45678' },
        { input: '4299945678', expected: '42-999-45678' },
        { input: '4212300001', expected: '42-123-00001' },
        { input: '4212399999', expected: '42-123-99999' },
      ];

      examples.forEach((example) => {
        const apiNumber = new ApiNumber(example.input);
        expect(apiNumber.getValue()).toBe(example.expected);
      });
    });
  });
});
