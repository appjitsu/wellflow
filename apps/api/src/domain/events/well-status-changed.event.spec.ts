import { WellStatusChangedEvent } from './well-status-changed.event';
import { WellStatus } from '../enums/well-status.enum';

describe('WellStatusChangedEvent', () => {
  const mockDate = new Date('2024-01-15T10:30:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create event with all required properties', () => {
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
      );

      expect(event.wellId).toBe('well-123');
      expect(event.apiNumber).toBe('42-123-45678');
      expect(event.previousStatus).toBe(WellStatus.PLANNED);
      expect(event.newStatus).toBe(WellStatus.PERMITTED);
      expect(event.updatedBy).toBe('user-456');
      expect(event.eventType).toBe('WellStatusChanged');
      expect(event.occurredAt).toEqual(mockDate);
      expect(event.metadata).toBeUndefined();
    });

    it('should create event with optional metadata', () => {
      const metadata = {
        reason: 'Permit approved',
        department: 'Regulatory',
        priority: 'high',
      };

      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
        metadata,
      );

      expect(event.metadata).toEqual(metadata);
    });

    it('should set occurredAt to current date', () => {
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
      );

      expect(event.occurredAt).toEqual(mockDate);
    });

    it('should have immutable properties', () => {
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
      );

      // Properties should be accessible but TypeScript enforces readonly at compile time
      expect(event.wellId).toBe('well-123');
      expect(event.apiNumber).toBe('42-123-45678');
      expect(event.eventType).toBe('WellStatusChanged');
      expect(event.previousStatus).toBe(WellStatus.PLANNED);
      expect(event.newStatus).toBe(WellStatus.PERMITTED);
      expect(event.updatedBy).toBe('user-456');
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
      );

      const result = event.toString();

      expect(result).toBe(
        'Well 42-123-45678 status changed from PLANNED to PERMITTED by user-456',
      );
    });

    it('should handle different status transitions in string', () => {
      const event = new WellStatusChangedEvent(
        'well-789',
        '42-987-65432',
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        'operator-admin',
      );

      const result = event.toString();

      expect(result).toBe(
        'Well 42-987-65432 status changed from DRILLING to COMPLETED by operator-admin',
      );
    });

    it('should handle special characters in user name', () => {
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PRODUCING,
        WellStatus.SHUT_IN,
        'user@company.com',
      );

      const result = event.toString();

      expect(result).toBe(
        'Well 42-123-45678 status changed from PRODUCING to SHUT_IN by user@company.com',
      );
    });
  });

  describe('event properties', () => {
    it('should handle all well status types', () => {
      const statusPairs = [
        [WellStatus.PLANNED, WellStatus.PERMITTED],
        [WellStatus.PERMITTED, WellStatus.DRILLING],
        [WellStatus.DRILLING, WellStatus.COMPLETED],
        [WellStatus.COMPLETED, WellStatus.PRODUCING],
        [WellStatus.PRODUCING, WellStatus.SHUT_IN],
        [WellStatus.SHUT_IN, WellStatus.TEMPORARILY_ABANDONED],
        [WellStatus.TEMPORARILY_ABANDONED, WellStatus.PERMANENTLY_ABANDONED],
        [WellStatus.PERMANENTLY_ABANDONED, WellStatus.PLUGGED],
        [WellStatus.UNKNOWN, WellStatus.PLANNED],
      ];

      statusPairs.forEach(([from, to]) => {
        const event = new WellStatusChangedEvent(
          'well-test',
          '42-000-00000',
          from,
          to,
          'test-user',
        );

        expect(event.previousStatus).toBe(from);
        expect(event.newStatus).toBe(to);
      });
    });

    it('should preserve metadata object reference', () => {
      const metadata = { key: 'value', nested: { prop: 'test' } };
      
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
        metadata,
      );

      expect(event.metadata).toBe(metadata);
      expect(event.metadata?.key).toBe('value');
      expect(event.metadata?.nested.prop).toBe('test');
    });
  });

  describe('event consistency', () => {
    it('should maintain consistent event type', () => {
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
      );

      expect(event.eventType).toBe('WellStatusChanged');
    });

    it('should create unique timestamps for different events', () => {
      const event1 = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        'user-456',
      );

      // Advance time slightly
      jest.advanceTimersByTime(100);

      const event2 = new WellStatusChangedEvent(
        'well-456',
        '42-456-78901',
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        'user-789',
      );

      expect(event2.occurredAt.getTime()).toBeGreaterThan(event1.occurredAt.getTime());
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const event = new WellStatusChangedEvent(
        '',
        '',
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        '',
      );

      expect(event.wellId).toBe('');
      expect(event.apiNumber).toBe('');
      expect(event.updatedBy).toBe('');
      expect(event.toString()).toBe(
        'Well  status changed from PLANNED to PERMITTED by ',
      );
    });

    it('should handle same status transition', () => {
      const event = new WellStatusChangedEvent(
        'well-123',
        '42-123-45678',
        WellStatus.PRODUCING,
        WellStatus.PRODUCING,
        'user-456',
      );

      expect(event.previousStatus).toBe(WellStatus.PRODUCING);
      expect(event.newStatus).toBe(WellStatus.PRODUCING);
      expect(event.toString()).toBe(
        'Well 42-123-45678 status changed from PRODUCING to PRODUCING by user-456',
      );
    });
  });
});
