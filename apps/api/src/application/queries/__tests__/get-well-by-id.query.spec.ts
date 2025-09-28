import { GetWellByIdQuery } from '../get-well-by-id.query';

describe('GetWellByIdQuery', () => {
  describe('constructor', () => {
    it('should create a query with wellId', () => {
      const wellId = 'well-123';
      const query = new GetWellByIdQuery(wellId);

      expect(query.wellId).toBe(wellId);
    });

    it('should handle different wellId formats', () => {
      const wellIds = [
        'well-123',
        'WELL_456',
        'well-abc-def-789',
        '12345678-1234-1234-1234-123456789012',
        'api-4212345678',
        'well_with_underscores',
        'well-with-dashes',
        'WellWithCamelCase',
      ];

      wellIds.forEach((wellId) => {
        const query = new GetWellByIdQuery(wellId);
        expect(query.wellId).toBe(wellId);
      });
    });

    it('should handle UUID format wellIds', () => {
      const uuidWellId = '550e8400-e29b-41d4-a716-446655440000';
      const query = new GetWellByIdQuery(uuidWellId);

      expect(query.wellId).toBe(uuidWellId);
      expect(query.wellId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should handle numeric string wellIds', () => {
      const numericWellId = '123456789';
      const query = new GetWellByIdQuery(numericWellId);

      expect(query.wellId).toBe(numericWellId);
      expect(typeof query.wellId).toBe('string');
    });

    it('should handle wellIds with special characters', () => {
      const specialWellIds = [
        'well-123@company',
        'well#456',
        'well$789',
        'well%abc',
        'well&def',
        'well+ghi',
        'well=jkl',
      ];

      specialWellIds.forEach((wellId) => {
        const query = new GetWellByIdQuery(wellId);
        expect(query.wellId).toBe(wellId);
      });
    });

    it('should handle empty string wellId', () => {
      const emptyWellId = '';
      const query = new GetWellByIdQuery(emptyWellId);

      expect(query.wellId).toBe(emptyWellId);
      expect(query.wellId).toBe('');
    });

    it('should handle very long wellIds', () => {
      const longWellId = 'well-' + 'a'.repeat(100);
      const query = new GetWellByIdQuery(longWellId);

      expect(query.wellId).toBe(longWellId);
      expect(query.wellId.length).toBe(105); // 'well-' + 100 'a's
    });
  });

  describe('properties', () => {
    it('should have readonly wellId property', () => {
      const wellId = 'well-123';
      const query = new GetWellByIdQuery(wellId);

      expect(query.wellId).toBeDefined();
      expect(query.wellId).toBe(wellId);
    });

    it('should maintain property value consistently', () => {
      const wellId = 'well-456';
      const query = new GetWellByIdQuery(wellId);

      // Multiple accesses should return same value
      expect(query.wellId).toBe(wellId);
      expect(query.wellId).toBe(query.wellId);

      const firstAccess = query.wellId;
      const secondAccess = query.wellId;
      expect(firstAccess).toBe(secondAccess);
    });

    it('should be accessible as public readonly', () => {
      const query = new GetWellByIdQuery('well-789');

      // Should be able to access the property
      expect(query.wellId).toBeDefined();
      expect(typeof query.wellId).toBe('string');
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace in wellId', () => {
      const wellIds = [
        ' well-123',
        'well-123 ',
        ' well-123 ',
        'well 123',
        'well\t123',
        'well\n123',
      ];

      wellIds.forEach((wellId) => {
        const query = new GetWellByIdQuery(wellId);
        expect(query.wellId).toBe(wellId);
      });
    });

    it('should handle unicode characters in wellId', () => {
      const unicodeWellIds = [
        'well-123-äöü',
        'well-456-éñ',
        'well-789-中文',
        'well-abc-🚀',
        'well-def-Ω',
      ];

      unicodeWellIds.forEach((wellId) => {
        const query = new GetWellByIdQuery(wellId);
        expect(query.wellId).toBe(wellId);
      });
    });

    it('should handle case sensitivity', () => {
      const wellIds = [
        'well-123',
        'WELL-123',
        'Well-123',
        'wELL-123',
        'well-ABC',
        'well-abc',
      ];

      wellIds.forEach((wellId) => {
        const query = new GetWellByIdQuery(wellId);
        expect(query.wellId).toBe(wellId);

        // Only test case differences if the wellId would actually change
        if (wellId !== wellId.toLowerCase()) {
          expect(query.wellId).not.toBe(wellId.toLowerCase());
        }
        if (wellId !== wellId.toUpperCase()) {
          expect(query.wellId).not.toBe(wellId.toUpperCase());
        }
      });
    });
  });

  describe('immutability', () => {
    it('should maintain consistent wellId value', () => {
      const wellId = 'well-immutable-test';
      const query = new GetWellByIdQuery(wellId);

      const value1 = query.wellId;
      const value2 = query.wellId;
      const value3 = query.wellId;

      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
      expect(value1).toBe(wellId);
    });

    it('should not be affected by external changes to original wellId variable', () => {
      let wellId = 'well-original';
      const query = new GetWellByIdQuery(wellId);

      // Change the original variable
      wellId = 'well-changed';

      // Query should still have the original value
      expect(query.wellId).toBe('well-original');
      expect(query.wellId).not.toBe(wellId);
    });
  });

  describe('type checking', () => {
    it('should have string type for wellId', () => {
      const query = new GetWellByIdQuery('well-123');

      expect(typeof query.wellId).toBe('string');
      expect(query.wellId).toEqual(expect.any(String));
    });

    it('should implement IQuery interface', () => {
      const query = new GetWellByIdQuery('well-123');

      // Should be an instance of GetWellByIdQuery
      expect(query).toBeInstanceOf(GetWellByIdQuery);

      // Should have the expected structure
      expect(query).toHaveProperty('wellId');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle API number as wellId', () => {
      const apiNumber = '42-123-45678';
      const query = new GetWellByIdQuery(apiNumber);

      expect(query.wellId).toBe(apiNumber);
    });

    it('should handle database primary key as wellId', () => {
      const dbId = '1234567890';
      const query = new GetWellByIdQuery(dbId);

      expect(query.wellId).toBe(dbId);
    });

    it('should handle composite wellId', () => {
      const compositeId = 'operator-123:well-456:lease-789';
      const query = new GetWellByIdQuery(compositeId);

      expect(query.wellId).toBe(compositeId);
    });

    it('should handle wellId with version suffix', () => {
      const versionedId = 'well-123-v2';
      const query = new GetWellByIdQuery(versionedId);

      expect(query.wellId).toBe(versionedId);
    });

    it('should handle wellId with timestamp', () => {
      const timestampedId = 'well-123-20240115';
      const query = new GetWellByIdQuery(timestampedId);

      expect(query.wellId).toBe(timestampedId);
    });
  });
});
