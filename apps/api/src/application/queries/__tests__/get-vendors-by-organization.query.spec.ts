import { GetVendorsByOrganizationQuery } from '../get-vendors-by-organization.query';
import {
  VendorStatus,
  VendorType,
  VendorRating,
} from '../../../domain/enums/vendor-status.enum';

describe('GetVendorsByOrganizationQuery', () => {
  it('should create query with organizationId and no optional parameters', () => {
    const organizationId = 'test-org-id';
    const query = new GetVendorsByOrganizationQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toBeUndefined();
    expect(query.pagination).toBeUndefined();
  });

  it('should create query with filters', () => {
    const organizationId = 'test-org-id';
    const filters = {
      status: [VendorStatus.APPROVED, VendorStatus.PREQUALIFIED],
      vendorType: [VendorType.SERVICE],
      isPrequalified: true,
      hasValidInsurance: true,
      performanceRating: [VendorRating.EXCELLENT],
      searchTerm: 'drilling',
    };
    const query = new GetVendorsByOrganizationQuery(organizationId, filters);
    expect(query.organizationId).toBe(organizationId);
    expect(query.filters).toEqual(filters);
  });

  it('should create query with pagination', () => {
    const organizationId = 'test-org-id';
    const pagination = {
      page: 2,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'ASC' as const,
    };
    const query = new GetVendorsByOrganizationQuery(
      organizationId,
      undefined,
      pagination,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.pagination).toEqual(pagination);
  });

  it('should be an instance of GetVendorsByOrganizationQuery', () => {
    const query = new GetVendorsByOrganizationQuery('org');
    expect(query).toBeInstanceOf(GetVendorsByOrganizationQuery);
  });
});
