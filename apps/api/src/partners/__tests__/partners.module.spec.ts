import { PartnersModule } from '../partners.module';

describe('PartnersModule', () => {
  it('should be defined', () => {
    expect(PartnersModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof PartnersModule).toBe('function');
  });

  it('should have a prototype', () => {
    expect(PartnersModule.prototype).toBeDefined();
  });
});
