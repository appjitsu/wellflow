import { GetDivisionOrdersByOrganizationQuery } from '../get-division-orders-by-organization.query';

describe('GetDivisionOrdersByOrganizationQuery', () => {
  it('should create query with organizationId and default values', () => {
    const organizationId = 'test-org-id';
    const query = new GetDivisionOrdersByOrganizationQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.filters).toBeUndefined();
  });

  it('should create query with custom page and limit', () => {
    const organizationId = 'test-org-id';
    const page = 2;
    const limit = 20;
    const query = new GetDivisionOrdersByOrganizationQuery(
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
      wellId: 'well-123',
      partnerId: 'partner-456',
      isActive: true,
      effectiveDateFrom: new Date('2023-01-01'),
      effectiveDateTo: new Date('2023-12-31'),
    };
    const query = new GetDivisionOrdersByOrganizationQuery(
      organizationId,
      1,
      10,
      filters,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toEqual(filters);
  });

  it('should be an instance of GetDivisionOrdersByOrganizationQuery', () => {
    const query = new GetDivisionOrdersByOrganizationQuery('test');
    expect(query).toBeInstanceOf(GetDivisionOrdersByOrganizationQuery);
  });
});
