import { ListPermitsQuery } from '../list-permits.query';

describe('ListPermitsQuery', () => {
  it('should create query with organizationId and no optional parameters', () => {
    const organizationId = 'test-org-id';
    const query = new ListPermitsQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toBeUndefined();
    expect(query.pagination).toBeUndefined();
    expect(query.sort).toBeUndefined();
  });

  it('should create query with filters', () => {
    const organizationId = 'test-org-id';
    const filters = {
      status: 'active',
      permitType: 'drilling',
      wellId: 'well-123',
      issuingAgency: 'EPA',
      expiringWithinDays: 30,
      requiresRenewal: true,
    };
    const query = new ListPermitsQuery(organizationId, filters);
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toEqual(filters);
  });

  it('should create query with pagination', () => {
    const organizationId = 'test-org-id';
    const pagination = {
      page: 2,
      limit: 20,
    };
    const query = new ListPermitsQuery(organizationId, undefined, pagination);
    expect(query.organizationId).toBe(organizationId);
    expect(query.pagination).toEqual(pagination);
  });

  it('should create query with sort', () => {
    const organizationId = 'test-org-id';
    const sort = {
      field: 'expirationDate',
      direction: 'asc' as const,
    };
    const query = new ListPermitsQuery(
      organizationId,
      undefined,
      undefined,
      sort,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.sort).toEqual(sort);
  });

  it('should be an instance of ListPermitsQuery', () => {
    const query = new ListPermitsQuery('org');
    expect(query).toBeInstanceOf(ListPermitsQuery);
  });
});
