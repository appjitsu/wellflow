import { GetDivisionOrdersByWellQuery } from '../get-division-orders-by-well.query';

describe('GetDivisionOrdersByWellQuery', () => {
  it('should create query with wellId and no optional parameters', () => {
    const wellId = 'test-well-id';
    const query = new GetDivisionOrdersByWellQuery(wellId);
    expect(query.wellId).toBe(wellId);
    expect(query.isActive).toBeUndefined();
    expect(query.effectiveDate).toBeUndefined();
  });

  it('should create query with isActive', () => {
    const wellId = 'test-well-id';
    const isActive = true;
    const query = new GetDivisionOrdersByWellQuery(wellId, isActive);
    expect(query.wellId).toBe(wellId);
    expect(query.isActive).toBe(isActive);
  });

  it('should create query with effectiveDate', () => {
    const wellId = 'test-well-id';
    const effectiveDate = new Date('2023-01-01');
    const query = new GetDivisionOrdersByWellQuery(
      wellId,
      undefined,
      effectiveDate,
    );
    expect(query.wellId).toBe(wellId);
    expect(query.effectiveDate).toBe(effectiveDate);
  });

  it('should be an instance of GetDivisionOrdersByWellQuery', () => {
    const query = new GetDivisionOrdersByWellQuery('well');
    expect(query).toBeInstanceOf(GetDivisionOrdersByWellQuery);
  });
});
