import { GetDrillingProgramsByOrganizationQuery } from '../get-drilling-programs-by-organization.query';
import { DrillingProgramStatus } from '../../../domain/enums/drilling-program-status.enum';

describe('GetDrillingProgramsByOrganizationQuery', () => {
  it('should create query with organizationId and default values', () => {
    const organizationId = 'test-org-id';
    const query = new GetDrillingProgramsByOrganizationQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.filters).toBeUndefined();
  });

  it('should create query with custom page and limit', () => {
    const organizationId = 'test-org-id';
    const page = 2;
    const limit = 20;
    const query = new GetDrillingProgramsByOrganizationQuery(
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
      status: DrillingProgramStatus.APPROVED,
      wellId: 'well-123',
    };
    const query = new GetDrillingProgramsByOrganizationQuery(
      organizationId,
      1,
      10,
      filters,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toEqual(filters);
  });

  it('should be an instance of GetDrillingProgramsByOrganizationQuery', () => {
    const query = new GetDrillingProgramsByOrganizationQuery('test');
    expect(query).toBeInstanceOf(GetDrillingProgramsByOrganizationQuery);
  });
});
