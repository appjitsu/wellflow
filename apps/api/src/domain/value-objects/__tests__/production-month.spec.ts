import { ProductionMonth } from '../production-month';

describe('ProductionMonth Value Object', () => {
  describe('constructor', () => {
    it('should create production month with valid year and month', () => {
      const productionMonth = new ProductionMonth(2024, 3);

      expect(productionMonth.getYear()).toBe(2024);
      expect(productionMonth.getMonth()).toBe(3);
    });

    it('should throw error for invalid year', () => {
      expect(() => new ProductionMonth(1800, 3)).toThrow(
        'Year must be an integer between 1900 and 2100',
      );
      expect(() => new ProductionMonth(2200, 3)).toThrow(
        'Year must be an integer between 1900 and 2100',
      );
    });

    it('should throw error for invalid month', () => {
      expect(() => new ProductionMonth(2024, 0)).toThrow(
        'Month must be an integer between 1 and 12',
      );
      expect(() => new ProductionMonth(2024, 13)).toThrow(
        'Month must be an integer between 1 and 12',
      );
    });

    it('should throw error for non-integer values', () => {
      expect(() => new ProductionMonth(2024.5, 3)).toThrow(
        'Year must be an integer between 1900 and 2100',
      );
      expect(() => new ProductionMonth(2024, 3.5)).toThrow(
        'Month must be an integer between 1 and 12',
      );
    });
  });

  describe('formatting methods', () => {
    it('should format as YYYY-MM string', () => {
      const productionMonth = new ProductionMonth(2024, 3);
      expect(productionMonth.getFormattedString()).toBe('2024-03');
    });

    it('should format as display string', () => {
      const productionMonth = new ProductionMonth(2024, 3);
      expect(productionMonth.getDisplayString()).toBe('March 2024');
    });

    it('should format as short display string', () => {
      const productionMonth = new ProductionMonth(2024, 3);
      expect(productionMonth.getShortDisplayString()).toBe('Mar 2024');
    });

    it('should convert to string', () => {
      const productionMonth = new ProductionMonth(2024, 3);
      expect(productionMonth.toString()).toBe('2024-03');
    });
  });

  describe('date methods', () => {
    it('should get correct date (first day of month)', () => {
      const productionMonth = new ProductionMonth(2024, 3);
      const date = productionMonth.getDate();

      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(2); // JavaScript months are 0-based
      expect(date.getDate()).toBe(1);
    });

    it('should get last day of month', () => {
      const productionMonth = new ProductionMonth(2024, 2); // February
      const lastDay = productionMonth.getLastDayOfMonth();

      expect(lastDay.getDate()).toBe(29); // 2024 is a leap year
    });

    it('should get days in month', () => {
      const feb2024 = new ProductionMonth(2024, 2);
      const feb2023 = new ProductionMonth(2023, 2);
      const march = new ProductionMonth(2024, 3);

      expect(feb2024.getDaysInMonth()).toBe(29); // Leap year
      expect(feb2023.getDaysInMonth()).toBe(28); // Non-leap year
      expect(march.getDaysInMonth()).toBe(31);
    });
  });

  describe('comparison methods', () => {
    it('should check equality correctly', () => {
      const month1 = new ProductionMonth(2024, 3);
      const month2 = new ProductionMonth(2024, 3);
      const month3 = new ProductionMonth(2024, 4);

      expect(month1.equals(month2)).toBe(true);
      expect(month1.equals(month3)).toBe(false);
    });

    it('should compare before correctly', () => {
      const march = new ProductionMonth(2024, 3);
      const april = new ProductionMonth(2024, 4);

      expect(march.isBefore(april)).toBe(true);
      expect(april.isBefore(march)).toBe(false);
    });

    it('should compare after correctly', () => {
      const march = new ProductionMonth(2024, 3);
      const april = new ProductionMonth(2024, 4);

      expect(april.isAfter(march)).toBe(true);
      expect(march.isAfter(april)).toBe(false);
    });

    it('should calculate months between', () => {
      const jan = new ProductionMonth(2024, 1);
      const march = new ProductionMonth(2024, 3);
      const nextYearJan = new ProductionMonth(2025, 1);

      expect(jan.monthsBetween(march)).toBe(2);
      expect(march.monthsBetween(jan)).toBe(-2);
      expect(jan.monthsBetween(nextYearJan)).toBe(12);
    });
  });

  describe('navigation methods', () => {
    it('should get previous month', () => {
      const march = new ProductionMonth(2024, 3);
      const previous = march.getPreviousMonth();

      expect(previous.getYear()).toBe(2024);
      expect(previous.getMonth()).toBe(2);
    });

    it('should get next month', () => {
      const march = new ProductionMonth(2024, 3);
      const next = march.getNextMonth();

      expect(next.getYear()).toBe(2024);
      expect(next.getMonth()).toBe(4);
    });

    it('should handle year boundaries', () => {
      const december = new ProductionMonth(2023, 12);
      const january = new ProductionMonth(2024, 1);

      const nextMonth = december.getNextMonth();
      const prevMonth = january.getPreviousMonth();

      expect(nextMonth.getYear()).toBe(2024);
      expect(nextMonth.getMonth()).toBe(1);
      expect(prevMonth.getYear()).toBe(2023);
      expect(prevMonth.getMonth()).toBe(12);
    });
  });

  describe('static factory methods', () => {
    it('should create from date', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const productionMonth = ProductionMonth.fromDate(date);

      expect(productionMonth.getYear()).toBe(2024);
      expect(productionMonth.getMonth()).toBe(3);
    });

    it('should create from string', () => {
      const productionMonth = ProductionMonth.fromString('2024-03');

      expect(productionMonth.getYear()).toBe(2024);
      expect(productionMonth.getMonth()).toBe(3);
    });

    it('should throw error for invalid string format', () => {
      expect(() => ProductionMonth.fromString('2024/03')).toThrow(
        'Invalid date string format. Expected YYYY-MM',
      );
      expect(() => ProductionMonth.fromString('24-03')).toThrow(
        'Invalid date string format. Expected YYYY-MM',
      );
    });

    it('should create current month', () => {
      const current = ProductionMonth.current();
      const now = new Date();

      expect(current.getYear()).toBe(now.getFullYear());
      expect(current.getMonth()).toBe(now.getMonth() + 1);
    });

    it('should create previous month', () => {
      const previous = ProductionMonth.previous();
      const now = new Date();
      const expectedPrevious = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      );

      expect(previous.getYear()).toBe(expectedPrevious.getFullYear());
      expect(previous.getMonth()).toBe(expectedPrevious.getMonth() + 1);
    });
  });

  describe('range method', () => {
    it('should generate range of months', () => {
      const start = new ProductionMonth(2024, 1);
      const end = new ProductionMonth(2024, 3);
      const range = ProductionMonth.range(start, end);

      expect(range).toHaveLength(3);
      expect(range[0]!.equals(new ProductionMonth(2024, 1))).toBe(true);
      expect(range[1]!.equals(new ProductionMonth(2024, 2))).toBe(true);
      expect(range[2]!.equals(new ProductionMonth(2024, 3))).toBe(true);
    });

    it('should throw error if start is after end', () => {
      const start = new ProductionMonth(2024, 3);
      const end = new ProductionMonth(2024, 1);

      expect(() => ProductionMonth.range(start, end)).toThrow(
        'Start month must be before or equal to end month',
      );
    });

    it('should handle single month range', () => {
      const month = new ProductionMonth(2024, 3);
      const range = ProductionMonth.range(month, month);

      expect(range).toHaveLength(1);
      expect(range[0]!.equals(month)).toBe(true);
    });
  });

  describe('database methods', () => {
    it('should create from database date', () => {
      const dbDate = new Date(2024, 2, 1); // March 1, 2024
      const productionMonth = ProductionMonth.fromDatabaseDate(dbDate);

      expect(productionMonth.getYear()).toBe(2024);
      expect(productionMonth.getMonth()).toBe(3);
    });

    it('should create from database date string', () => {
      const dbDateString = '2024-03-01';
      const productionMonth = ProductionMonth.fromDatabaseDate(dbDateString);

      expect(productionMonth.getYear()).toBe(2024);
      expect(productionMonth.getMonth()).toBe(3);
    });

    it('should convert to database date', () => {
      const productionMonth = new ProductionMonth(2024, 3);
      const dbDate = productionMonth.toDatabaseDate();

      expect(dbDate.getFullYear()).toBe(2024);
      expect(dbDate.getMonth()).toBe(2); // JavaScript months are 0-based
      expect(dbDate.getDate()).toBe(1);
    });
  });
});
