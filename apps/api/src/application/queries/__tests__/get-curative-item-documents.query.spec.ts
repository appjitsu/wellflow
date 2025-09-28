import { GetCurativeItemDocumentsQuery } from '../get-curative-item-documents.query';

describe('GetCurativeItemDocumentsQuery', () => {
  it('should create query with curativeItemId and organizationId', () => {
    const curativeItemId = 'test-curative-id';
    const organizationId = 'test-org-id';
    const query = new GetCurativeItemDocumentsQuery(
      curativeItemId,
      organizationId,
    );
    expect(query.curativeItemId).toBe(curativeItemId);
    expect(query.organizationId).toBe(organizationId);
  });

  it('should be an instance of GetCurativeItemDocumentsQuery', () => {
    const query = new GetCurativeItemDocumentsQuery('item', 'org');
    expect(query).toBeInstanceOf(GetCurativeItemDocumentsQuery);
  });
});
