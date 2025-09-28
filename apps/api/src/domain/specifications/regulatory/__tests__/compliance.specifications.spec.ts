import { PermitExpiringSoonSpecification } from '../compliance.specifications';

describe('PermitExpiringSoonSpecification', () => {
  it('should be defined', () => {
    const spec = new PermitExpiringSoonSpecification(30);

    expect(spec).toBeDefined();
    expect(spec.getMetadata().name).toBe('PermitExpiringSoon');
  });
});
