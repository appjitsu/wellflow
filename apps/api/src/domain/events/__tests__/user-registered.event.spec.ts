import { UserRegisteredEvent } from '../user-registered.event';

describe('UserRegisteredEvent', () => {
  it('should create a valid event', () => {
    const event = new UserRegisteredEvent(
      'user-123',
      'org-456',
      'user@example.com',
      'John',
      'Doe',
      'admin',
      true,
    );
    expect(event).toBeDefined();
    expect(event.eventType).toBe('UserRegistered');
    expect(event.userId).toBe('user-123');
  });
});
