import { GetVendorsWithExpiringQualificationsQuery } from '../get-vendors-with-expiring-qualifications.query';

describe('GetVendorsWithExpiringQualificationsQuery', () => {
  it('should create query with organizationId and default daysUntilExpiration', () => {
    const organizationId = 'test-org-id';
    const query = new GetVendorsWithExpiringQualificationsQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.daysUntilExpiration).toBe(30);
  });

  it('should create query with custom daysUntilExpiration', () => {
    const organizationId = 'test-org-id';
    const daysUntilExpiration = 60;
    const query = new GetVendorsWithExpiringQualificationsQuery(
      organizationId,
      daysUntilExpiration,
    );
    expect(query.organizationId).toBe(organizationId);
    expect(query.daysUntilExpiration).toBe(daysUntilExpiration);
  });

  it('should be an instance of GetVendorsWithExpiringQualificationsQuery', () => {
    const query = new GetVendorsWithExpiringQualificationsQuery('org');
    expect(query).toBeInstanceOf(GetVendorsWithExpiringQualificationsQuery);
  });
});
