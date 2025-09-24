import { StatementMonth } from '../statement-month';

describe('StatementMonth Value Object', () => {
  describe('constructor', () => {
    it('should create valid statement month', () => {
      const statementMonth = new StatementMonth(2024, 3);

      expect(statementMonth.getYear()).toBe(2024);
      expect(statementMonth.getMonth()).toBe(3);
    });

    it('should throw error for invalid year', () => {
      expect(() => new StatementMonth(1999, 3)).toThrow(
        'Year must be between 2000 and 2100',
      );
      expect(() => new StatementMonth(2101, 3)).toThrow(
        'Year must be between 2000 and 2100',
      );
    });

    it('should throw error for invalid month', () => {
      expect(() => new StatementMonth(2024, 0)).toThrow(
        'Month must be between 1 and 12',
      );
      expect(() => new StatementMonth(2024, 13)).toThrow(
        'Month must be between 1 and 12',
      );
    });
  });

  describe('static factory methods', () => {
    it('should create from string format YYYY-MM', () => {
      const statementMonth = StatementMonth.fromString('2024-03');

      expect(statementMonth.getYear()).toBe(2024);
      expect(statementMonth.getMonth()).toBe(3);
    });

    it('should create from Date object', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024 (month is 0-indexed)
      const statementMonth = StatementMonth.fromDate(date);

      expect(statementMonth.getYear()).toBe(2024);
      expect(statementMonth.getMonth()).toBe(3);
    });

    it('should create current month', () => {
      const now = new Date();
      const statementMonth = StatementMonth.current();

      expect(statementMonth.getYear()).toBe(now.getFullYear());
      expect(statementMonth.getMonth()).toBe(now.getMonth() + 1);
    });

    it('should throw error for invalid string format', () => {
      expect(() => StatementMonth.fromString('2024-3')).toThrow(
        'Invalid date string format',
      );
      expect(() => StatementMonth.fromString('24-03')).toThrow(
        'Invalid date string format',
      );
      expect(() => StatementMonth.fromString('invalid')).toThrow(
        'Invalid date string format',
      );
    });
  });

  describe('comparison methods', () => {
    const march2024 = new StatementMonth(2024, 3);
    const april2024 = new StatementMonth(2024, 4);
    const march2023 = new StatementMonth(2023, 3);

    it('should check equality correctly', () => {
      const anotherMarch2024 = new StatementMonth(2024, 3);

      expect(march2024.equals(anotherMarch2024)).toBe(true);
      expect(march2024.equals(april2024)).toBe(false);
      expect(march2024.equals(march2023)).toBe(false);
    });

    it('should check if before another month', () => {
      expect(march2024.isBefore(april2024)).toBe(true);
      expect(march2023.isBefore(march2024)).toBe(true);
      expect(april2024.isBefore(march2024)).toBe(false);
      expect(march2024.isBefore(march2024)).toBe(false);
    });

    it('should check if after another month', () => {
      expect(april2024.isAfter(march2024)).toBe(true);
      expect(march2024.isAfter(march2023)).toBe(true);
      expect(march2024.isAfter(april2024)).toBe(false);
      expect(march2024.isAfter(march2024)).toBe(false);
    });
  });

  describe('navigation methods', () => {
    const march2024 = new StatementMonth(2024, 3);

    it('should get next month', () => {
      const nextMonth = march2024.getNextMonth();

      expect(nextMonth.getYear()).toBe(2024);
      expect(nextMonth.getMonth()).toBe(4);
    });

    it('should get previous month', () => {
      const prevMonth = march2024.getPreviousMonth();

      expect(prevMonth.getYear()).toBe(2024);
      expect(prevMonth.getMonth()).toBe(2);
    });

    it('should handle year transitions for next month', () => {
      const december2024 = new StatementMonth(2024, 12);
      const nextMonth = december2024.getNextMonth();

      expect(nextMonth.getYear()).toBe(2025);
      expect(nextMonth.getMonth()).toBe(1);
    });

    it('should handle year transitions for previous month', () => {
      const january2024 = new StatementMonth(2024, 1);
      const prevMonth = january2024.getPreviousMonth();

      expect(prevMonth.getYear()).toBe(2023);
      expect(prevMonth.getMonth()).toBe(12);
    });
  });

  describe('date conversion methods', () => {
    const march2024 = new StatementMonth(2024, 3);

    it('should get first day of month', () => {
      const firstDay = march2024.getFirstDayOfMonth();

      expect(firstDay.getFullYear()).toBe(2024);
      expect(firstDay.getMonth()).toBe(2); // 0-indexed
      expect(firstDay.getDate()).toBe(1);
    });

    it('should get last day of month', () => {
      const lastDay = march2024.getLastDayOfMonth();

      expect(lastDay.getFullYear()).toBe(2024);
      expect(lastDay.getMonth()).toBe(2); // 0-indexed
      expect(lastDay.getDate()).toBe(31); // March has 31 days
    });

    it('should handle February in leap year', () => {
      const february2024 = new StatementMonth(2024, 2); // 2024 is a leap year
      const lastDay = february2024.getLastDayOfMonth();

      expect(lastDay.getDate()).toBe(29);
    });

    it('should handle February in non-leap year', () => {
      const february2023 = new StatementMonth(2023, 2); // 2023 is not a leap year
      const lastDay = february2023.getLastDayOfMonth();

      expect(lastDay.getDate()).toBe(28);
    });
  });

  describe('formatting methods', () => {
    const march2024 = new StatementMonth(2024, 3);

    it('should convert to string format', () => {
      expect(march2024.toString()).toBe('2024-03');
    });

    it('should convert to display string', () => {
      expect(march2024.toDisplayString()).toBe('March 2024');
    });

    it('should convert to short display string', () => {
      expect(march2024.toShortDisplayString()).toBe('Mar 2024');
    });
  });

  describe('JSON serialization', () => {
    const march2024 = new StatementMonth(2024, 3);

    it('should serialize to JSON', () => {
      const json = march2024.toJSON();

      expect(json).toEqual({
        year: 2024,
        month: 3,
        displayString: 'March 2024',
        isoString: '2024-03',
      });
    });

    it('should work with JSON.stringify', () => {
      const jsonString = JSON.stringify(march2024);
      const parsed = JSON.parse(jsonString);

      expect(parsed.year).toBe(2024);
      expect(parsed.month).toBe(3);
      expect(parsed.displayString).toBe('March 2024');
      expect(parsed.isoString).toBe('2024-03');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const march2024 = new StatementMonth(2024, 3);
      const nextMonth = march2024.getNextMonth();

      // Original should not be modified
      expect(march2024.getYear()).toBe(2024);
      expect(march2024.getMonth()).toBe(3);

      // New instance should have different values
      expect(nextMonth.getYear()).toBe(2024);
      expect(nextMonth.getMonth()).toBe(4);
    });
  });
});
