import { GetAfesByOrganizationQuery } from '../get-afes-by-organization.query';
import { AfeStatus, AfeType } from '../../../domain/enums/afe-status.enum';

describe('GetAfesByOrganizationQuery', () => {
  it('should create query with organizationId and default values', () => {
    const organizationId = 'test-org-id';
    const query = new GetAfesByOrganizationQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.filters).toBeUndefined();
  });

  it('should create query with custom page and limit', () => {
    const organizationId = 'test-org-id';
    const page = 2;
    const limit = 20;
    const query = new GetAfesByOrganizationQuery(organizationId, page, limit);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(page);
    expect(query.limit).toBe(limit);
  });

  it('should create query with filters', () => {
    const organizationId = 'test-org-id';
    const filters = {
      status: AfeStatus.APPROVED,
      afeType: AfeType.DRILLING,
      wellId: 'well-123',
      leaseId: 'lease-456',
    };
    const query = new GetAfesByOrganizationQuery(
      organizationId,
      1,
      10,
      filters,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toEqual(filters);
  });

  it('should be an instance of GetAfesByOrganizationQuery', () => {
    const query = new GetAfesByOrganizationQuery('test');
    expect(query).toBeInstanceOf(GetAfesByOrganizationQuery);
  });
});
