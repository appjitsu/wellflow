import { AfesModule } from '../afes.module';

describe('AfesModule', () => {
  it('should be defined', () => {
    expect(AfesModule).toBeDefined();
  });

  it('should be a valid NestJS module', () => {
    expect(AfesModule).toBeInstanceOf(Function);
    expect(typeof AfesModule).toBe('function');
  });
});
