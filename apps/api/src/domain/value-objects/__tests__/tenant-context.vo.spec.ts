import { TenantContext } from '../tenant-context.vo';

describe('TenantContext', () => {
  it('should create a valid tenant context', () => {
    const context = TenantContext.create({
      organizationId: 'org-123',
      userId: 'user-456',
      userRole: 'admin',
    });
    expect(context).toBeDefined();
    expect(context.organizationId).toBe('org-123');
  });
});
