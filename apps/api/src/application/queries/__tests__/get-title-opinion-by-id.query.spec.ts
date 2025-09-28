import { GetTitleOpinionByIdQuery } from '../get-title-opinion-by-id.query';

describe('GetTitleOpinionByIdQuery', () => {
  it('should create query with id and organizationId', () => {
    const id = 'test-id';
    const organizationId = 'test-org-id';
    const query = new GetTitleOpinionByIdQuery(id, organizationId);
    expect(query.id).toBe(id);
    expect(query.organizationId).toBe(organizationId);
  });

  it('should be an instance of GetTitleOpinionByIdQuery', () => {
    const query = new GetTitleOpinionByIdQuery('id', 'org');
    expect(query).toBeInstanceOf(GetTitleOpinionByIdQuery);
  });
});
