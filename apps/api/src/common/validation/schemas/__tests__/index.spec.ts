import * as schemas from '../index';

describe('Validation Schemas Index', () => {
  it('should export all schemas', () => {
    expect(schemas.userSchemas).toBeDefined();
    expect(schemas.organizationSchemas).toBeDefined();
    expect(schemas.leaseSchemas).toBeDefined();
    expect(schemas.wellSchemas).toBeDefined();
    expect(schemas.productionSchemas).toBeDefined();
    expect(schemas.partnerSchemas).toBeDefined();
  });
});
