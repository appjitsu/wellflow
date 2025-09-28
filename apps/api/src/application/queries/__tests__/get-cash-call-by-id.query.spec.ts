import { GetCashCallByIdQuery } from '../get-cash-call-by-id.query';

describe('GetCashCallByIdQuery', () => {
  it('should create query with organizationId and id', () => {
    const organizationId = 'test-org-id';
    const id = 'test-id';
    const query = new GetCashCallByIdQuery(organizationId, id);
    expect(query.organizationId).toBe(organizationId);
    expect(query.id).toBe(id);
  });

  it('should be an instance of GetCashCallByIdQuery', () => {
    const query = new GetCashCallByIdQuery('org', 'id');
    expect(query).toBeInstanceOf(GetCashCallByIdQuery);
  });
});
