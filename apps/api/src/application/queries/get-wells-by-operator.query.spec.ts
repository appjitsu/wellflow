import { GetWellsByOperatorQuery } from './get-wells-by-operator.query';

describe('GetWellsByOperatorQuery', () => {
  describe('constructor', () => {
    it('should create a query with all parameters', () => {
      const operatorId = 'operator-123';
      const page = 2;
      const limit = 20;
      const filters = {
        status: 'producing',
        wellType: 'oil',
      };

      const query = new GetWellsByOperatorQuery(
        operatorId,
        page,
        limit,
        filters,
      );

      expect(query.operatorId).toBe(operatorId);
      expect(query.page).toBe(page);
      expect(query.limit).toBe(limit);
      expect(query.filters).toEqual(filters);
    });

    it('should create a query with default pagination values', () => {
      const operatorId = 'operator-456';
      const query = new GetWellsByOperatorQuery(operatorId);

      expect(query.operatorId).toBe(operatorId);
      expect(query.page).toBe(1);
      expect(query.limit).toBe(10);
      expect(query.filters).toBeUndefined();
    });

    it('should create a query with custom page only', () => {
      const operatorId = 'operator-789';
      const page = 3;
      const query = new GetWellsByOperatorQuery(operatorId, page);

      expect(query.operatorId).toBe(operatorId);
      expect(query.page).toBe(page);
      expect(query.limit).toBe(10); // default
      expect(query.filters).toBeUndefined();
    });

    it('should create a query with custom page and limit', () => {
      const operatorId = 'operator-abc';
      const page = 5;
      const limit = 50;
      const query = new GetWellsByOperatorQuery(operatorId, page, limit);

      expect(query.operatorId).toBe(operatorId);
      expect(query.page).toBe(page);
      expect(query.limit).toBe(limit);
      expect(query.filters).toBeUndefined();
    });

    it('should handle different operatorId formats', () => {
      const operatorIds = [
        'operator-123',
        'OPERATOR_456',
        'op-abc-def-789',
        '12345678-1234-1234-1234-123456789012',
        'company-xyz',
        'operator@company.com',
      ];

      operatorIds.forEach((operatorId) => {
        const query = new GetWellsByOperatorQuery(operatorId);
        expect(query.operatorId).toBe(operatorId);
      });
    });

    it('should handle various page values', () => {
      const operatorId = 'operator-123';
      const pages = [1, 2, 5, 10, 100, 1000];

      pages.forEach((page) => {
        const query = new GetWellsByOperatorQuery(operatorId, page);
        expect(query.page).toBe(page);
      });
    });

    it('should handle various limit values', () => {
      const operatorId = 'operator-123';
      const limits = [1, 5, 10, 25, 50, 100, 500];

      limits.forEach((limit) => {
        const query = new GetWellsByOperatorQuery(operatorId, 1, limit);
        expect(query.limit).toBe(limit);
      });
    });

    it('should handle different filter combinations', () => {
      const operatorId = 'operator-123';

      const filterCombinations = [
        { status: 'producing' },
        { wellType: 'oil' },
        { status: 'drilling', wellType: 'gas' },
        { status: 'completed' },
        { wellType: 'water' },
        {},
      ];

      filterCombinations.forEach((filters) => {
        const query = new GetWellsByOperatorQuery(operatorId, 1, 10, filters);
        expect(query.filters).toEqual(filters);
      });
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const query = new GetWellsByOperatorQuery('operator-123', 2, 20, {
        status: 'producing',
      });

      expect(query.operatorId).toBeDefined();
      expect(query.page).toBeDefined();
      expect(query.limit).toBeDefined();
      expect(query.filters).toBeDefined();
    });

    it('should maintain property values consistently', () => {
      const operatorId = 'operator-456';
      const page = 3;
      const limit = 25;
      const filters = { status: 'drilling', wellType: 'oil' };

      const query = new GetWellsByOperatorQuery(
        operatorId,
        page,
        limit,
        filters,
      );

      // Multiple accesses should return same values
      expect(query.operatorId).toBe(operatorId);
      expect(query.operatorId).toBe(query.operatorId);
      expect(query.page).toBe(page);
      expect(query.page).toBe(query.page);
      expect(query.limit).toBe(limit);
      expect(query.limit).toBe(query.limit);
      expect(query.filters).toEqual(filters);
      expect(query.filters).toBe(query.filters);
    });
  });

  describe('default values', () => {
    it('should use default page value of 1', () => {
      const query = new GetWellsByOperatorQuery('operator-123');
      expect(query.page).toBe(1);
    });

    it('should use default limit value of 10', () => {
      const query = new GetWellsByOperatorQuery('operator-123');
      expect(query.limit).toBe(10);
    });

    it('should have undefined filters by default', () => {
      const query = new GetWellsByOperatorQuery('operator-123');
      expect(query.filters).toBeUndefined();
    });

    it('should preserve explicit values over defaults', () => {
      const query = new GetWellsByOperatorQuery('operator-123', 5, 50);
      expect(query.page).toBe(5);
      expect(query.limit).toBe(50);
      expect(query.page).not.toBe(1);
      expect(query.limit).not.toBe(10);
    });
  });

  describe('filters', () => {
    it('should handle status filter only', () => {
      const filters = { status: 'producing' };
      const query = new GetWellsByOperatorQuery('operator-123', 1, 10, filters);

      expect(query.filters?.status).toBe('producing');
      expect(query.filters?.wellType).toBeUndefined();
    });

    it('should handle wellType filter only', () => {
      const filters = { wellType: 'gas' };
      const query = new GetWellsByOperatorQuery('operator-123', 1, 10, filters);

      expect(query.filters?.wellType).toBe('gas');
      expect(query.filters?.status).toBeUndefined();
    });

    it('should handle both filters', () => {
      const filters = { status: 'completed', wellType: 'oil' };
      const query = new GetWellsByOperatorQuery('operator-123', 1, 10, filters);

      expect(query.filters?.status).toBe('completed');
      expect(query.filters?.wellType).toBe('oil');
    });

    it('should handle empty filters object', () => {
      const filters = {};
      const query = new GetWellsByOperatorQuery('operator-123', 1, 10, filters);

      expect(query.filters).toEqual({});
      expect(query.filters?.status).toBeUndefined();
      expect(query.filters?.wellType).toBeUndefined();
    });

    it('should handle various status values', () => {
      const statuses = [
        'planned',
        'drilling',
        'completed',
        'producing',
        'shut_in',
        'plugged',
        'abandoned',
      ];

      statuses.forEach((status) => {
        const query = new GetWellsByOperatorQuery('operator-123', 1, 10, {
          status,
        });
        expect(query.filters?.status).toBe(status);
      });
    });

    it('should handle various wellType values', () => {
      const wellTypes = [
        'oil',
        'gas',
        'water',
        'injection',
        'disposal',
        'geothermal',
      ];

      wellTypes.forEach((wellType) => {
        const query = new GetWellsByOperatorQuery('operator-123', 1, 10, {
          wellType,
        });
        expect(query.filters?.wellType).toBe(wellType);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle zero page value', () => {
      const query = new GetWellsByOperatorQuery('operator-123', 0);
      expect(query.page).toBe(0);
    });

    it('should handle zero limit value', () => {
      const query = new GetWellsByOperatorQuery('operator-123', 1, 0);
      expect(query.limit).toBe(0);
    });

    it('should handle negative page value', () => {
      const query = new GetWellsByOperatorQuery('operator-123', -1);
      expect(query.page).toBe(-1);
    });

    it('should handle negative limit value', () => {
      const query = new GetWellsByOperatorQuery('operator-123', 1, -10);
      expect(query.limit).toBe(-10);
    });

    it('should handle empty string operatorId', () => {
      const query = new GetWellsByOperatorQuery('');
      expect(query.operatorId).toBe('');
    });

    it('should handle very large page numbers', () => {
      const largePage = 999999;
      const query = new GetWellsByOperatorQuery('operator-123', largePage);
      expect(query.page).toBe(largePage);
    });

    it('should handle very large limit values', () => {
      const largeLimit = 999999;
      const query = new GetWellsByOperatorQuery('operator-123', 1, largeLimit);
      expect(query.limit).toBe(largeLimit);
    });

    it('should handle special characters in filter values', () => {
      const filters = {
        status: 'status-with-dashes',
        wellType: 'type_with_underscores',
      };
      const query = new GetWellsByOperatorQuery('operator-123', 1, 10, filters);

      expect(query.filters?.status).toBe('status-with-dashes');
      expect(query.filters?.wellType).toBe('type_with_underscores');
    });
  });

  describe('immutability', () => {
    it('should maintain consistent values across multiple accesses', () => {
      const operatorId = 'operator-immutable';
      const page = 2;
      const limit = 15;
      const filters = { status: 'producing', wellType: 'oil' };

      const query = new GetWellsByOperatorQuery(
        operatorId,
        page,
        limit,
        filters,
      );

      const operatorId1 = query.operatorId;
      const operatorId2 = query.operatorId;
      const page1 = query.page;
      const page2 = query.page;
      const limit1 = query.limit;
      const limit2 = query.limit;
      const filters1 = query.filters;
      const filters2 = query.filters;

      expect(operatorId1).toBe(operatorId2);
      expect(page1).toBe(page2);
      expect(limit1).toBe(limit2);
      expect(filters1).toBe(filters2);
    });

    it('should maintain filter object reference', () => {
      const filters = { status: 'drilling' };
      const query = new GetWellsByOperatorQuery('operator-123', 1, 10, filters);

      expect(query.filters).toBe(filters);
      expect(query.filters?.status).toBe('drilling');
    });
  });

  describe('type checking', () => {
    it('should have correct types for all properties', () => {
      const query = new GetWellsByOperatorQuery('operator-123', 2, 20, {
        status: 'producing',
      });

      expect(typeof query.operatorId).toBe('string');
      expect(typeof query.page).toBe('number');
      expect(typeof query.limit).toBe('number');
      expect(typeof query.filters).toBe('object');
    });

    it('should implement IQuery interface', () => {
      const query = new GetWellsByOperatorQuery('operator-123');

      expect(query).toBeInstanceOf(GetWellsByOperatorQuery);
      expect(query).toHaveProperty('operatorId');
      expect(query).toHaveProperty('page');
      expect(query).toHaveProperty('limit');
    });
  });
});
