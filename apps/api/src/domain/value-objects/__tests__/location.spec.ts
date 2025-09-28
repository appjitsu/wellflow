import { Location } from '../location';
import { Coordinates } from '../coordinates';

describe('Location', () => {
  const validCoordinates = new Coordinates(40.7128, -74.006);

  describe('constructor', () => {
    it('should create valid location with all fields', () => {
      const location = new Location(validCoordinates, {
        address: '123 Main St',
        county: 'New York County',
        state: 'NY',
        country: 'USA',
      });

      expect(location.getCoordinates()).toBe(validCoordinates);
      expect(location.getAddress()).toBe('123 Main St');
      expect(location.getCounty()).toBe('New York County');
      expect(location.getState()).toBe('NY');
      expect(location.getCountry()).toBe('USA');
    });

    it('should create valid location with minimal fields', () => {
      const location = new Location(validCoordinates);

      expect(location.getCoordinates()).toBe(validCoordinates);
      expect(location.getAddress()).toBeUndefined();
      expect(location.getCounty()).toBeUndefined();
      expect(location.getState()).toBeUndefined();
      expect(location.getCountry()).toBe('US'); // Default country
    });

    it('should throw error for null coordinates', () => {
      expect(() => new Location(null as unknown as Coordinates)).toThrow(
        'Coordinates are required',
      );
    });

    it('should throw error for undefined coordinates', () => {
      expect(() => new Location(undefined as unknown as Coordinates)).toThrow(
        'Coordinates are required',
      );
    });

    it('should throw error for empty address', () => {
      expect(() => new Location(validCoordinates, { address: '' })).toThrow(
        'Address cannot be empty if provided',
      );
    });

    it('should throw error for empty county', () => {
      expect(
        () =>
          new Location(validCoordinates, {
            address: '123 Main St',
            county: '',
          }),
      ).toThrow('County cannot be empty if provided');
    });

    it('should throw error for empty state', () => {
      expect(
        () =>
          new Location(validCoordinates, {
            address: '123 Main St',
            county: 'County',
            state: '',
          }),
      ).toThrow('State cannot be empty if provided');
    });

    it('should throw error for empty country', () => {
      expect(
        () =>
          new Location(validCoordinates, {
            address: '123 Main St',
            county: 'County',
            state: 'NY',
            country: '',
          }),
      ).toThrow('Country cannot be empty if provided');
    });
  });

  describe('equals', () => {
    it('should return true for equal locations', () => {
      const location1 = new Location(validCoordinates, {
        address: '123 Main St',
        county: 'New York County',
        state: 'NY',
        country: 'USA',
      });
      const location2 = new Location(new Coordinates(40.7128, -74.006), {
        address: '123 Main St',
        county: 'New York County',
        state: 'NY',
        country: 'USA',
      });

      expect(location1.equals(location2)).toBe(true);
    });

    it('should return false for different coordinates', () => {
      const location1 = new Location(validCoordinates);
      const location2 = new Location(new Coordinates(40.7129, -74.006));

      expect(location1.equals(location2)).toBe(false);
    });

    it('should return false for different addresses', () => {
      const location1 = new Location(validCoordinates, {
        address: '123 Main St',
      });
      const location2 = new Location(validCoordinates, {
        address: '124 Main St',
      });

      expect(location1.equals(location2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const location = new Location(validCoordinates);
      expect(location.equals(null as unknown as Location)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation with all fields', () => {
      const location = new Location(validCoordinates, {
        address: '123 Main St',
        county: 'New York County',
        state: 'NY',
        country: 'USA',
      });

      const result = location.toString();
      expect(result).toContain('123 Main St');
      expect(result).toContain('New York County');
      expect(result).toContain('NY');
      expect(result).toContain('USA');
      expect(result).toContain('40.7128, -74.0060');
    });

    it('should return string representation with minimal fields', () => {
      const location = new Location(validCoordinates);
      const result = location.toString();
      expect(result).toBe('40.7128, -74.0060');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation with all fields', () => {
      const location = new Location(validCoordinates, {
        address: '123 Main St',
        county: 'New York County',
        state: 'NY',
        country: 'USA',
      });

      const json = location.toJSON();
      expect(json).toEqual({
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        address: '123 Main St',
        county: 'New York County',
        state: 'NY',
        country: 'USA',
      });
    });

    it('should return JSON representation with minimal fields', () => {
      const location = new Location(validCoordinates);
      const json = location.toJSON();
      expect(json).toEqual({
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        address: undefined,
        county: undefined,
        state: undefined,
        country: 'US', // Default country
      });
    });
  });
});
