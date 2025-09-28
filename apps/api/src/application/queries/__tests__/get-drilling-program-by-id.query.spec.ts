import { GetDrillingProgramByIdQuery } from '../get-drilling-program-by-id.query';

describe('GetDrillingProgramByIdQuery', () => {
  it('should create query with id', () => {
    const id = 'test-id';
    const query = new GetDrillingProgramByIdQuery(id);
    expect(query.id).toBe(id);
  });

  it('should be an instance of GetDrillingProgramByIdQuery', () => {
    const query = new GetDrillingProgramByIdQuery('test');
    expect(query).toBeInstanceOf(GetDrillingProgramByIdQuery);
  });
});
