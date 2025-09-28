import { organizations, users, leases } from '../index';

describe('schemas index', () => {
  it('should export organizations', () => {
    expect(organizations).toBeDefined();
  });

  it('should export users', () => {
    expect(users).toBeDefined();
  });

  it('should export leases', () => {
    expect(leases).toBeDefined();
  });
});
