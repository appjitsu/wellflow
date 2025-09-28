import { GetAfeByIdQuery } from '../get-afe-by-id.query';

describe('GetAfeByIdQuery', () => {
  it('should create query with afeId', () => {
    const afeId = 'test-afe-id';
    const query = new GetAfeByIdQuery(afeId);
    expect(query.afeId).toBe(afeId);
  });

  it('should be an instance of GetAfeByIdQuery', () => {
    const query = new GetAfeByIdQuery('test');
    expect(query).toBeInstanceOf(GetAfeByIdQuery);
  });
});
