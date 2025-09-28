import { VendorModule } from '../vendor.module';

describe('VendorModule', () => {
  it('should be defined', () => {
    expect(VendorModule).toBeDefined();
  });

  it('should be a valid NestJS module', () => {
    expect(VendorModule).toBeInstanceOf(Function);
    expect(typeof VendorModule).toBe('function');
  });
});
