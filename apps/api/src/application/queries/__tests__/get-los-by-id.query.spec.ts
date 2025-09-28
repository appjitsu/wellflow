import { GetLosByIdQuery } from '../get-los-by-id.query';

describe('GetLosByIdQuery', () => {
  it('should create query with losId', () => {
    const losId = 'test-los-id';
    const query = new GetLosByIdQuery(losId);
    expect(query.losId).toBe(losId);
  });

  it('should be an instance of GetLosByIdQuery', () => {
    const query = new GetLosByIdQuery('test');
    expect(query).toBeInstanceOf(GetLosByIdQuery);
  });
});
