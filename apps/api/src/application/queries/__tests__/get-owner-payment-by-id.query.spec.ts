import { GetOwnerPaymentByIdQuery } from '../get-owner-payment-by-id.query';

describe('GetOwnerPaymentByIdQuery', () => {
  it('should create query with id', () => {
    const id = 'test-id';
    const query = new GetOwnerPaymentByIdQuery(id);
    expect(query.id).toBe(id);
  });

  it('should be an instance of GetOwnerPaymentByIdQuery', () => {
    const query = new GetOwnerPaymentByIdQuery('test');
    expect(query).toBeInstanceOf(GetOwnerPaymentByIdQuery);
  });
});
