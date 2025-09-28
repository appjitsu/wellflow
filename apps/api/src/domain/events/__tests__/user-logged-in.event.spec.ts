import { UserLoggedInEvent } from '../user-logged-in.event';

describe('UserLoggedInEvent', () => {
  it('should be defined', () => {
    const event = new UserLoggedInEvent(
      'user-123',
      'org-456',
      'user@example.com',
      '192.168.1.1',
      'Mozilla/5.0',
      'session-789',
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('UserLoggedIn');
    expect(event.userId).toBe('user-123');
    expect(event.email).toBe('user@example.com');
  });
});
