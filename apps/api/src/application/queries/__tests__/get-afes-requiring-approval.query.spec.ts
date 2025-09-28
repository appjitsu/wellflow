import { GetAfesRequiringApprovalQuery } from '../get-afes-requiring-approval.query';

describe('GetAfesRequiringApprovalQuery', () => {
  it('should create query with organizationId', () => {
    const organizationId = 'test-org-id';
    const query = new GetAfesRequiringApprovalQuery(organizationId);
    expect(query.organizationId).toBe(organizationId);
  });

  it('should be an instance of GetAfesRequiringApprovalQuery', () => {
    const query = new GetAfesRequiringApprovalQuery('test');
    expect(query).toBeInstanceOf(GetAfesRequiringApprovalQuery);
  });
});
