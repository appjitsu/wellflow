import { GetWorkoversByOrganizationQuery } from '../get-workovers-by-organization.query';
import { WorkoverStatus } from '../../../domain/enums/workover-status.enum';

describe('GetWorkoversByOrganizationQuery', () => {
  it('should create query with organizationId and default values', () => {
    const organizationId = 'test-org-id';
    const query = new GetWorkoversByOrganizationQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.filters).toBeUndefined();
  });

  it('should create query with custom page and limit', () => {
    const organizationId = 'test-org-id';
    const page = 2;
    const limit = 20;
    const query = new GetWorkoversByOrganizationQuery(
      organizationId,
      page,
      limit,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(page);
    expect(query.limit).toBe(limit);
  });

  it('should create query with filters', () => {
    const organizationId = 'test-org-id';
    const filters = {
      status: WorkoverStatus.IN_PROGRESS,
      wellId: 'well-123',
    };
    const query = new GetWorkoversByOrganizationQuery(
      organizationId,
      1,
      10,
      filters,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toEqual(filters);
  });

  it('should be an instance of GetWorkoversByOrganizationQuery', () => {
    const query = new GetWorkoversByOrganizationQuery('test');
    expect(query).toBeInstanceOf(GetWorkoversByOrganizationQuery);
  });
});
