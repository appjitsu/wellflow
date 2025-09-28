import { Email } from '../email';

describe('Email', () => {
  it('should create a valid email', () => {
    const email = new Email('test@example.com');
    expect(email).toBeDefined();
    expect(email.getValue()).toBe('test@example.com');
  });

  it('should normalize email to lowercase', () => {
    const email = new Email('Test@Example.COM');
    expect(email.getValue()).toBe('test@example.com');
  });

  it('should throw error for invalid email', () => {
    expect(() => new Email('invalid-email')).toThrow();
  });
});
