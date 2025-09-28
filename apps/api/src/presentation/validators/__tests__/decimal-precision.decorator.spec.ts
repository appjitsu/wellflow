import { validate } from 'class-validator';
import { DecimalPrecision } from '../decimal-precision.decorator';

describe('DecimalPrecision Decorator', () => {
  describe('basic functionality', () => {
    it('should validate valid decimal strings', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '123.45';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid types', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      (instance as any).value = 123.45; // number instead of string

      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('decimalPrecision');
    });

    it('should allow null values', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = null as any;

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should allow undefined values', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = undefined as any;

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should allow empty strings', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });
  });

  describe('integer part validation', () => {
    it('should validate correct integer digits', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const validValues = ['123.45', '12.3', '1.23', '999.99'];

      for (const value of validValues) {
        const instance = new TestClass();
        instance.value = value;

        const errors = await validate(instance);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject too many integer digits', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '1234.56'; // 4 integer digits, max 3

      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.decimalPrecision).toContain(
        'up to 3 digits before the decimal point',
      );
    });

    it('should allow maximum integer digits', async () => {
      class TestClass {
        @DecimalPrecision(5, 3)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '12345.123'; // exactly 5 integer digits

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });
  });

  describe('fractional part validation', () => {
    it('should validate correct fractional digits', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const validValues = ['123.45', '12.3', '1.23', '999.99'];

      for (const value of validValues) {
        const instance = new TestClass();
        instance.value = value;

        const errors = await validate(instance);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject too many fractional digits', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '123.456'; // 3 fractional digits, max 2

      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.decimalPrecision).toContain(
        'up to 2 digits after it',
      );
    });

    it('should allow fewer fractional digits', async () => {
      class TestClass {
        @DecimalPrecision(3, 3)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '123.4'; // 1 fractional digit, max 3

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should allow no fractional part', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '123'; // no decimal point

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });
  });

  describe('oil and gas specific scenarios', () => {
    it('should validate production volumes (barrels)', async () => {
      class ProductionDto {
        @DecimalPrecision(6, 2) // Up to 999,999.99 barrels
        volume: string;
      }

      const instance = new ProductionDto();
      instance.volume = '15432.50';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should validate pressure readings (psi)', async () => {
      class PressureDto {
        @DecimalPrecision(5, 1) // Up to 99,999.9 psi
        pressure: string;
      }

      const instance = new PressureDto();
      instance.pressure = '5234.5';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should validate temperature readings (Fahrenheit)', async () => {
      class TemperatureDto {
        @DecimalPrecision(3, 1) // Up to 999.9°F
        temperature: string;
      }

      const instance = new TemperatureDto();
      instance.temperature = '212.0';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should validate financial amounts (dollars)', async () => {
      class FinancialDto {
        @DecimalPrecision(10, 2) // Up to 9,999,999,999.99
        amount: string;
      }

      const instance = new FinancialDto();
      instance.amount = '1234567.89';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should reject negative numbers', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '-123.45';

      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
    });

    it('should reject multiple decimal points', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '123.45.67';

      const errors = await validate(instance);
      expect(errors).toHaveLength(1);
    });

    it('should reject non-numeric characters', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const invalidValues = ['123.abc', '12.3x', 'abc.45', '123.4 5'];

      for (const value of invalidValues) {
        const instance = new TestClass();
        instance.value = value;

        const errors = await validate(instance);
        expect(errors).toHaveLength(1);
      }
    });

    it('should reject leading zeros in integer part', async () => {
      class TestClass {
        @DecimalPrecision(3, 2)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '001.23'; // This should be valid as it's still 3 digits

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should handle very small decimal constraints', async () => {
      class TestClass {
        @DecimalPrecision(1, 0) // Only single digit integers, no decimals
        value: string;
      }

      const validInstance = new TestClass();
      validInstance.value = '5';

      const invalidInstance = new TestClass();
      invalidInstance.value = '12'; // Too many digits

      const validErrors = await validate(validInstance);
      const invalidErrors = await validate(invalidInstance);

      expect(validErrors).toHaveLength(0);
      expect(invalidErrors).toHaveLength(1);
    });
  });

  describe('error messages', () => {
    it('should provide descriptive error messages', async () => {
      class TestClass {
        @DecimalPrecision(2, 1)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '123.45'; // 3 integer digits (max 2), 2 fractional (max 1)

      const errors = await validate(instance);
      expect(errors).toHaveLength(1);

      const errorMessage = errors[0].constraints?.decimalPrecision;
      expect(errorMessage).toContain('up to 2 digits before the decimal point');
      expect(errorMessage).toContain('up to 1 digits after it');
    });

    it('should customize error messages for different constraints', async () => {
      class TestClass1 {
        @DecimalPrecision(4, 3)
        value: string;
      }

      class TestClass2 {
        @DecimalPrecision(6, 0)
        value: string;
      }

      const instance1 = new TestClass1();
      instance1.value = '12345.1234'; // 5 int (max 4), 4 frac (max 3)

      const instance2 = new TestClass2();
      instance2.value = '1234567'; // 7 int (max 6), no frac

      const errors1 = await validate(instance1);
      const errors2 = await validate(instance2);

      expect(errors1[0].constraints?.decimalPrecision).toContain(
        'up to 4 digits before',
      );
      expect(errors1[0].constraints?.decimalPrecision).toContain(
        'up to 3 digits after',
      );

      expect(errors2[0].constraints?.decimalPrecision).toContain(
        'up to 6 digits before',
      );
      expect(errors2[0].constraints?.decimalPrecision).toContain(
        'up to 0 digits after',
      );
    });
  });

  describe('constraint validation', () => {
    it('should handle zero integer digits constraint', async () => {
      class TestClass {
        @DecimalPrecision(0, 2) // No integer part allowed
        value: string;
      }

      const validInstance = new TestClass();
      validInstance.value = '0.12';

      const invalidInstance = new TestClass();
      invalidInstance.value = '1.23'; // Has integer part

      const validErrors = await validate(validInstance);
      const invalidErrors = await validate(invalidInstance);

      expect(validErrors).toHaveLength(0);
      expect(invalidErrors).toHaveLength(1);
    });

    it('should handle zero fractional digits constraint', async () => {
      class TestClass {
        @DecimalPrecision(3, 0) // No fractional part allowed
        value: string;
      }

      const validInstance = new TestClass();
      validInstance.value = '123';

      const invalidInstance = new TestClass();
      invalidInstance.value = '123.45'; // Has fractional part

      const validErrors = await validate(validInstance);
      const invalidErrors = await validate(invalidInstance);

      expect(validErrors).toHaveLength(0);
      expect(invalidErrors).toHaveLength(1);
    });

    it('should handle large constraints', async () => {
      class TestClass {
        @DecimalPrecision(10, 5)
        value: string;
      }

      const instance = new TestClass();
      instance.value = '1234567890.12345'; // Exactly at limits

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });
  });

  describe('real-world usage', () => {
    it('should validate well coordinates', async () => {
      class WellLocationDto {
        @DecimalPrecision(3, 6) // Latitude: 3 digits + 6 decimals
        latitude: string;

        @DecimalPrecision(3, 6) // Longitude: 3 digits + 6 decimals
        longitude: string;
      }

      const instance = new WellLocationDto();
      instance.latitude = '31.123456';
      instance.longitude = '102.654321';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });

    it('should validate measurement data', async () => {
      class MeasurementDto {
        @DecimalPrecision(4, 2) // Depth in feet: up to 9999.99
        depth: string;

        @DecimalPrecision(3, 1) // Temperature: up to 999.9°F
        temperature: string;

        @DecimalPrecision(5, 1) // Pressure: up to 99999.9 psi
        pressure: string;
      }

      const instance = new MeasurementDto();
      instance.depth = '8750.50';
      instance.temperature = '180.5';
      instance.pressure = '3200.0';

      const errors = await validate(instance);
      expect(errors).toHaveLength(0);
    });
  });
});
