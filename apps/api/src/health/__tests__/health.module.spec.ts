import { HealthModule } from '../health.module';

describe('HealthModule', () => {
  it('should be defined', () => {
    expect(HealthModule).toBeDefined();
  });

  it('should be a valid NestJS module', () => {
    expect(HealthModule).toBeInstanceOf(Function);
    expect(typeof HealthModule).toBe('function');
  });
});
