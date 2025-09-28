import { UserEmailVerifiedEvent } from '../user-email-verified.event';

describe('UserEmailVerifiedEvent', () => {
  it('should be defined', () => {
    const event = new UserEmailVerifiedEvent(
      'user-123',
      'org-123',
      'user@example.com',
      new Date('2024-01-15T10:00:00Z'),
      '192.168.1.100',
      'Mozilla/5.0',
      { source: 'email_verification' },
    );

    expect(event).toBeDefined();
    expect(event.eventType).toBe('UserEmailVerified');
    expect(event.userId).toBe('user-123');
    expect(event.organizationId).toBe('org-123');
    expect(event.email).toBe('user@example.com');
    expect(event.ipAddress).toBe('192.168.1.100');
    expect(event.userAgent).toBe('Mozilla/5.0');
    expect(event.metadata).toEqual({ source: 'email_verification' });
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it('should generate correct string representation', () => {
    const event = new UserEmailVerifiedEvent(
      'user-123',
      'org-123',
      'user@example.com',
      new Date(),
      '192.168.1.100',
    );

    expect(event.toString()).toBe(
      'User user@example.com verified their email address from 192.168.1.100',
    );
  });

  it('should generate string representation without IP', () => {
    const event = new UserEmailVerifiedEvent(
      'user-123',
      'org-123',
      'user@example.com',
      new Date(),
    );

    expect(event.toString()).toBe(
      'User user@example.com verified their email address',
    );
  });
});
