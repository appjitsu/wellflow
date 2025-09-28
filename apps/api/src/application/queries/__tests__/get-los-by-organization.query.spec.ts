import { GetLosByOrganizationQuery } from '../get-los-by-organization.query';
import { LosStatus } from '../../../domain/enums/los-status.enum';

describe('GetLosByOrganizationQuery', () => {
  it('should create query with organizationId and no optional parameters', () => {
    const organizationId = 'test-org-id';
    const query = new GetLosByOrganizationQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.status).toBeUndefined();
    expect(query.limit).toBeUndefined();
    expect(query.offset).toBeUndefined();
  });

  it('should create query with status', () => {
    const organizationId = 'test-org-id';
    const status = LosStatus.DRAFT;
    const query = new GetLosByOrganizationQuery(organizationId, status);
    expect(query.organizationId).toBe(organizationId);
    expect(query.status).toBe(status);
  });

  it('should create query with limit and offset', () => {
    const organizationId = 'test-org-id';
    const limit = 50;
    const offset = 0;
    const query = new GetLosByOrganizationQuery(
      organizationId,
      undefined,
      limit,
      offset,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.limit).toBe(limit);
    expect(query.offset).toBe(offset);
  });

  it('should be an instance of GetLosByOrganizationQuery', () => {
    const query = new GetLosByOrganizationQuery('org');
    expect(query).toBeInstanceOf(GetLosByOrganizationQuery);
  });
});
