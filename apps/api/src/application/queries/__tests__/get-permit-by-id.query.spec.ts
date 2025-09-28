import { GetPermitByIdQuery } from '../get-permit-by-id.query';

describe('GetPermitByIdQuery', () => {
  it('should create query with permitId', () => {
    const permitId = 'test-permit-id';
    const query = new GetPermitByIdQuery(permitId);
    expect(query.permitId).toBe(permitId);
  });

  it('should be an instance of GetPermitByIdQuery', () => {
    const query = new GetPermitByIdQuery('test');
    expect(query).toBeInstanceOf(GetPermitByIdQuery);
  });
});
