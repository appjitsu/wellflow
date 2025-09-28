import { GetChainOfTitleByLeaseQuery } from '../get-chain-of-title-by-lease.query';

describe('GetChainOfTitleByLeaseQuery', () => {
  it('should create query with leaseId, organizationId and default values', () => {
    const leaseId = 'test-lease-id';
    const organizationId = 'test-org-id';
    const query = new GetChainOfTitleByLeaseQuery(leaseId, organizationId);
    expect(query.leaseId).toBe(leaseId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(1);
    expect(query.limit).toBe(100);
  });

  it('should create query with custom page and limit', () => {
    const leaseId = 'test-lease-id';
    const organizationId = 'test-org-id';
    const page = 2;
    const limit = 50;
    const query = new GetChainOfTitleByLeaseQuery(
      leaseId,
      organizationId,
      page,
      limit,
    );
    expect(query.leaseId).toBe(leaseId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(page);
    expect(query.limit).toBe(limit);
  });

  it('should be an instance of GetChainOfTitleByLeaseQuery', () => {
    const query = new GetChainOfTitleByLeaseQuery('lease', 'org');
    expect(query).toBeInstanceOf(GetChainOfTitleByLeaseQuery);
  });
});
