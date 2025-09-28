import { GetTitleOpinionDocumentsQuery } from '../get-title-opinion-documents.query';

describe('GetTitleOpinionDocumentsQuery', () => {
  it('should create query with titleOpinionId and organizationId', () => {
    const titleOpinionId = 'test-title-id';
    const organizationId = 'test-org-id';
    const query = new GetTitleOpinionDocumentsQuery(
      titleOpinionId,
      organizationId,
    );
    expect(query.titleOpinionId).toBe(titleOpinionId);
    expect(query.organizationId).toBe(organizationId);
  });

  it('should be an instance of GetTitleOpinionDocumentsQuery', () => {
    const query = new GetTitleOpinionDocumentsQuery('title', 'org');
    expect(query).toBeInstanceOf(GetTitleOpinionDocumentsQuery);
  });
});
