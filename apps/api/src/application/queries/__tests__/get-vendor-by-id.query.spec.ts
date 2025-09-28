import { GetVendorByIdQuery } from '../get-vendor-by-id.query';

describe('GetVendorByIdQuery', () => {
  it('should create query with vendorId', () => {
    const vendorId = 'test-vendor-id';
    const query = new GetVendorByIdQuery(vendorId);
    expect(query.vendorId).toBe(vendorId);
  });

  it('should be an instance of GetVendorByIdQuery', () => {
    const query = new GetVendorByIdQuery('test');
    expect(query).toBeInstanceOf(GetVendorByIdQuery);
  });
});
