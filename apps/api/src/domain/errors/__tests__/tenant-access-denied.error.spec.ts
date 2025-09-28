import { TenantAccessDeniedError } from '../tenant-access-denied.error';

describe('TenantAccessDeniedError', () => {
  it('should create a valid error', () => {
    const error = new TenantAccessDeniedError(
      'Access denied to resource',
      'org-123',
      'user-456',
      'some-resource',
    );
    expect(error).toBeDefined();
    expect(error.name).toBe('TenantAccessDeniedError');
    expect(error.message).toBe('Access denied to resource');
    expect(error.organizationId).toBe('org-123');
  });
});
