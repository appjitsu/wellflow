import { GetLosByLeaseQuery } from '../get-los-by-lease.query';
import { LosStatus } from '../../../domain/enums/los-status.enum';

describe('GetLosByLeaseQuery', () => {
  it('should create query with leaseId and no optional parameters', () => {
    const leaseId = 'test-lease-id';
    const query = new GetLosByLeaseQuery(leaseId);
    expect(query.leaseId).toBe(leaseId);
    expect(query.status).toBeUndefined();
    expect(query.limit).toBeUndefined();
    expect(query.offset).toBeUndefined();
  });

  it('should create query with status', () => {
    const leaseId = 'test-lease-id';
    const status = LosStatus.FINALIZED;
    const query = new GetLosByLeaseQuery(leaseId, status);
    expect(query.leaseId).toBe(leaseId);
    expect(query.status).toBe(status);
  });

  it('should create query with limit and offset', () => {
    const leaseId = 'test-lease-id';
    const limit = 20;
    const offset = 10;
    const query = new GetLosByLeaseQuery(leaseId, undefined, limit, offset);
    expect(query.leaseId).toBe(leaseId);
    expect(query.limit).toBe(limit);
    expect(query.offset).toBe(offset);
  });

  it('should be an instance of GetLosByLeaseQuery', () => {
    const query = new GetLosByLeaseQuery('lease');
    expect(query).toBeInstanceOf(GetLosByLeaseQuery);
  });
});
