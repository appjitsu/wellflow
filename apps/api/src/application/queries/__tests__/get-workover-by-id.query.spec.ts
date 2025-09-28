import { GetWorkoverByIdQuery } from '../get-workover-by-id.query';

describe('GetWorkoverByIdQuery', () => {
  it('should create query with id', () => {
    const id = 'test-id';
    const query = new GetWorkoverByIdQuery(id);
    expect(query.id).toBe(id);
  });

  it('should be an instance of GetWorkoverByIdQuery', () => {
    const query = new GetWorkoverByIdQuery('test');
    expect(query).toBeInstanceOf(GetWorkoverByIdQuery);
  });
});
