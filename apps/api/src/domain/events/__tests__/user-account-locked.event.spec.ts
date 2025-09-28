import { UserAccountLockedEvent } from '../user-account-locked.event';

describe('UserAccountLockedEvent', () => {
  it('should be defined', () => {
    const event = new UserAccountLockedEvent(
      'user-123',
      'org-456',
      'user@example.com',
      5,
      new Date(Date.now() + 30 * 60 * 1000), // 30 min later
      '192.168.1.1',
      'Mozilla/5.0',
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('UserAccountLocked');
    expect(event.userId).toBe('user-123');
    expect(event.failedAttempts).toBe(5);
  });
});
