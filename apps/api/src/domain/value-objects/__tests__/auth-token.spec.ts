import { AuthToken, AuthTokenType } from '../auth-token';

describe('AuthToken', () => {
  it('should be defined', () => {
    const token = AuthToken.createEmailVerificationToken();
    expect(token).toBeDefined();
  });

  it('should create email verification token', () => {
    const token = AuthToken.createEmailVerificationToken();
    expect(token.getTokenType()).toBe(AuthTokenType.EMAIL_VERIFICATION);
    expect(token.isValid()).toBe(true);
    expect(token.getValue()).toBeDefined();
  });

  it('should create password reset token', () => {
    const token = AuthToken.createPasswordResetToken();
    expect(token.getTokenType()).toBe(AuthTokenType.PASSWORD_RESET);
    expect(token.isValid()).toBe(true);
  });

  it('should create refresh token', () => {
    const token = AuthToken.createRefreshToken();
    expect(token.getTokenType()).toBe(AuthTokenType.REFRESH_TOKEN);
    expect(token.isValid()).toBe(true);
  });

  it('should validate token value', () => {
    expect(() => {
      AuthToken.fromValues(
        'short',
        new Date(Date.now() + 1000),
        AuthTokenType.EMAIL_VERIFICATION,
      );
    }).toThrow('Token must be at least 32 characters long');
  });

  it('should check expiration', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = AuthToken.fromValues(
      'a'.repeat(32),
      futureDate,
      AuthTokenType.EMAIL_VERIFICATION,
    );
    expect(token.isExpired()).toBe(false);
    expect(token.isValid()).toBe(true);
  });
});
