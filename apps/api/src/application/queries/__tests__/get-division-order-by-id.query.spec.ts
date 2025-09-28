import { GetDivisionOrderByIdQuery } from '../get-division-order-by-id.query';

describe('GetDivisionOrderByIdQuery', () => {
  it('should create query with divisionOrderId', () => {
    const divisionOrderId = 'test-division-id';
    const query = new GetDivisionOrderByIdQuery(divisionOrderId);
    expect(query.divisionOrderId).toBe(divisionOrderId);
  });

  it('should be an instance of GetDivisionOrderByIdQuery', () => {
    const query = new GetDivisionOrderByIdQuery('test');
    expect(query).toBeInstanceOf(GetDivisionOrderByIdQuery);
  });
});
