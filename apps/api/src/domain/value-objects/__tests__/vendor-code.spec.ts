import { VendorCode } from '../vendor-code';

describe('VendorCode Value Object', () => {
  describe('Valid Vendor Codes', () => {
    it('should create vendor code with valid format', () => {
      const validCodes = [
        'ABC-123',
        'ACME-001',
        'DRILL_CO_01',
        'SERVICE-PROVIDER-123',
        'A1B2C3',
        'TEST123',
      ];

      validCodes.forEach((code) => {
        const vendorCode = new VendorCode(code);
        expect(vendorCode.getValue()).toBe(code);
      });
    });

    it('should handle minimum length codes', () => {
      const minCode = new VendorCode('ABC');
      expect(minCode.getValue()).toBe('ABC');
    });

    it('should handle maximum length codes', () => {
      const maxCode = new VendorCode('A'.repeat(20));
      expect(maxCode.getValue()).toBe('A'.repeat(20));
    });

    it('should allow alphanumeric characters', () => {
      const alphanumericCode = new VendorCode('ABC123DEF456');
      expect(alphanumericCode.getValue()).toBe('ABC123DEF456');
    });

    it('should allow hyphens and underscores', () => {
      const codeWithSeparators = new VendorCode('ABC-123_DEF');
      expect(codeWithSeparators.getValue()).toBe('ABC-123_DEF');
    });
  });

  describe('Invalid Vendor Codes', () => {
    it('should reject codes that are too short', () => {
      expect(() => new VendorCode('AB')).toThrow(
        'Vendor code must be between 3 and 20 characters',
      );
      expect(() => new VendorCode('A')).toThrow(
        'Vendor code must be between 3 and 20 characters',
      );
      expect(() => new VendorCode('')).toThrow(
        'Vendor code must be between 3 and 20 characters',
      );
    });

    it('should reject codes that are too long', () => {
      const longCode = 'A'.repeat(21);
      expect(() => new VendorCode(longCode)).toThrow(
        'Vendor code must be between 3 and 20 characters',
      );
    });

    it('should reject codes with invalid characters', () => {
      const invalidCodes = [
        'ABC@123', // @ symbol
        'ABC 123', // space
        'ABC#123', // # symbol
        'ABC$123', // $ symbol
        'ABC%123', // % symbol
        'ABC.123', // period
        'ABC,123', // comma
        'ABC!123', // exclamation
      ];

      invalidCodes.forEach((code) => {
        expect(() => new VendorCode(code)).toThrow(
          'Vendor code can only contain letters, numbers, hyphens, and underscores',
        );
      });
    });

    it('should reject codes that start with invalid characters', () => {
      // Note: Based on the business rules, codes starting with numbers should be valid
      // Only test the ones that should actually be invalid
      expect(() => new VendorCode('-ABC123')).toThrow(
        'Vendor code must start with a letter or number',
      );
      expect(() => new VendorCode('_ABC123')).toThrow(
        'Vendor code must start with a letter or number',
      );
    });

    it('should reject codes that end with invalid characters', () => {
      const invalidEndCodes = [
        'ABC123-', // ends with hyphen
        'ABC123_', // ends with underscore
      ];

      invalidEndCodes.forEach((code) => {
        expect(() => new VendorCode(code)).toThrow(
          'Vendor code must end with a letter or number',
        );
      });
    });

    it('should reject null or undefined codes', () => {
      expect(() => new VendorCode(null as any)).toThrow(
        'Vendor code is required',
      );
      expect(() => new VendorCode(undefined as any)).toThrow(
        'Vendor code is required',
      );
    });
  });

  describe('Auto-generation', () => {
    it('should generate vendor code from company name', () => {
      const testCases = [
        { name: 'ACME Corporation', expected: 'ACME-CORP' },
        { name: 'ABC Drilling Services LLC', expected: 'ABC-DRILL' },
        { name: 'Houston Oil & Gas', expected: 'HOUSTON-OIL' },
        { name: 'Smith & Associates', expected: 'SMITH-ASSOC' },
        { name: 'XYZ Company', expected: 'XYZ-CO' },
      ];

      testCases.forEach(({ name, expected }) => {
        const generatedCode = VendorCode.generateFromCompanyName(name);
        expect(generatedCode).toBe(expected);
      });
    });

    it('should handle company names with special characters', () => {
      const testCases = [
        { name: 'A&B Services, Inc.', expected: 'AB-SERVICES' },
        { name: "O'Reilly Drilling Co.", expected: 'OREILLY-DRILL' },
        { name: 'Smith-Jones LLC', expected: 'SMITH-JONE-LLC' },
        { name: '123 Energy Corp', expected: '123-ENERGY' },
      ];

      testCases.forEach(({ name, expected }) => {
        const generatedCode = VendorCode.generateFromCompanyName(name);
        expect(generatedCode).toBe(expected);
      });
    });

    it('should truncate long company names', () => {
      const longName = 'Very Long Company Name That Exceeds Maximum Length';
      const generatedCode = VendorCode.generateFromCompanyName(longName);
      expect(generatedCode.length).toBeLessThanOrEqual(20);
      expect(generatedCode).toBe('VERY-LONG');
    });

    it('should handle single word company names', () => {
      const singleWordName = 'ACME';
      const generatedCode = VendorCode.generateFromCompanyName(singleWordName);
      expect(generatedCode).toBe('ACME');
    });

    it('should generate unique codes with suffix', () => {
      const baseName = 'ACME Corporation';
      const codes = [
        VendorCode.generateFromCompanyName(baseName, 1),
        VendorCode.generateFromCompanyName(baseName, 2),
        VendorCode.generateFromCompanyName(baseName, 10),
      ];

      expect(codes[0]).toBe('ACME-CORP-01');
      expect(codes[1]).toBe('ACME-CORP-02');
      expect(codes[2]).toBe('ACME-CORP-10');
    });
  });

  describe('Equality and Comparison', () => {
    it('should be equal when values are the same', () => {
      const code1 = new VendorCode('ABC-123');
      const code2 = new VendorCode('ABC-123');

      expect(code1.equals(code2)).toBe(true);
      expect(code1.getValue()).toBe(code2.getValue());
    });

    it('should not be equal when values are different', () => {
      const code1 = new VendorCode('ABC-123');
      const code2 = new VendorCode('DEF-456');

      expect(code1.equals(code2)).toBe(false);
    });

    it('should be case sensitive', () => {
      const code1 = new VendorCode('ABC-123');
      const code2 = new VendorCode('abc-123');

      expect(code1.equals(code2)).toBe(false);
    });

    it('should have consistent toString representation', () => {
      const code = new VendorCode('ABC-123');
      expect(code.toString()).toBe('ABC-123');
    });
  });

  describe('Validation Methods', () => {
    it('should validate format correctly', () => {
      const validCodes = ['ABC-123', 'ACME001', 'TEST_CODE'];
      const invalidCodes = ['AB', 'A'.repeat(21), 'ABC@123', '-ABC'];

      validCodes.forEach((code) => {
        expect(VendorCode.isValidFormat(code)).toBe(true);
      });

      invalidCodes.forEach((code) => {
        expect(VendorCode.isValidFormat(code)).toBe(false);
      });
    });

    it('should normalize vendor codes', () => {
      const testCases = [
        { input: 'abc-123', expected: 'ABC-123' },
        { input: 'ACME corp', expected: 'ACME-CORP' },
        { input: 'test__code', expected: 'TEST_CODE' },
        { input: '  ABC-123  ', expected: 'ABC-123' },
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = VendorCode.normalize(input);
        expect(normalized).toBe(expected);
      });
    });
  });

  describe('Business Rules', () => {
    it('should enforce uniqueness constraint concept', () => {
      // This test demonstrates the concept that vendor codes should be unique
      // within an organization, though the actual uniqueness is enforced at the repository level
      const code1 = new VendorCode('ABC-123');
      const code2 = new VendorCode('ABC-123');

      // Same codes should be equal (for uniqueness checking)
      expect(code1.equals(code2)).toBe(true);
    });

    it('should support different vendor code patterns', () => {
      const patterns = [
        'DRILL-001', // Drilling contractor pattern
        'SERVICE-ABC', // Service provider pattern
        'SUPPLY-123', // Supplier pattern
        'CONSULT-XYZ', // Consultant pattern
        'EQUIP-456', // Equipment rental pattern
      ];

      patterns.forEach((pattern) => {
        const code = new VendorCode(pattern);
        expect(code.getValue()).toBe(pattern);
      });
    });

    it('should maintain immutability', () => {
      const code = new VendorCode('ABC-123');
      const originalValue = code.getValue();

      // Value objects should be immutable
      expect(code.getValue()).toBe(originalValue);

      // Creating a new instance should not affect the original
      const newCode = new VendorCode('DEF-456');
      expect(code.getValue()).toBe(originalValue);
      expect(newCode.getValue()).toBe('DEF-456');
    });
  });
});
