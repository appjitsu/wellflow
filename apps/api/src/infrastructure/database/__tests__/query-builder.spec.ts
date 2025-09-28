import { describe, it, expect } from '@jest/globals';
import { QueryBuilderFactory, QueryUtils } from '../query-builder';

describe('QueryBuilder', () => {
  it('should export QueryBuilderFactory', () => {
    expect(QueryBuilderFactory).toBeDefined();
  });

  it('should export QueryUtils', () => {
    expect(QueryUtils).toBeDefined();
  });
});
