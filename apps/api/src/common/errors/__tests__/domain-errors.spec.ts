import { WellNotFoundError } from '../domain-errors';

describe('WellNotFoundError', () => {
  it('should be defined', () => {
    const error = new WellNotFoundError('test-id');
    expect(error).toBeDefined();
    expect(error.message).toBe("Well with ID 'test-id' was not found");
    expect(error.code).toBe('WELL_NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });
});
