import { GetJoaByIdQuery } from '../get-joa-by-id.query';

describe('GetJoaByIdQuery', () => {
  it('should create query with organizationId and id', () => {
    const organizationId = 'test-org-id';
    const id = 'test-id';
    const query = new GetJoaByIdQuery(organizationId, id);
    expect(query.organizationId).toBe(organizationId);
    expect(query.id).toBe(id);
  });

  it('should be an instance of GetJoaByIdQuery', () => {
    const query = new GetJoaByIdQuery('org', 'id');
    expect(query).toBeInstanceOf(GetJoaByIdQuery);
  });
});
