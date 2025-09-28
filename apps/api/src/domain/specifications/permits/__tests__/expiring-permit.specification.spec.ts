import { ExpiringPermitSpecification } from '../expiring-permit.specification';

describe('ExpiringPermitSpecification', () => {
  it('should be defined', () => {
    const spec = new ExpiringPermitSpecification(30);
    expect(spec).toBeDefined();
  });
});
