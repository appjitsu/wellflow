import { AuthModule } from '../auth.module';

describe('AuthModule', () => {
  it('should be defined', () => {
    expect(AuthModule).toBeDefined();
  });

  it('should be a valid NestJS module', () => {
    expect(AuthModule).toBeInstanceOf(Function);
    expect(typeof AuthModule).toBe('function');
  });
});
