import { Coordinates } from './coordinates';

describe('Coordinates', () => {
  describe('constructor', () => {
    it('should create valid coordinates', () => {
      const coords = new Coordinates(40.7128, -74.006);
      expect(coords.getLatitude()).toBe(40.7128);
      expect(coords.getLongitude()).toBe(-74.006);
    });

    it('should throw error for invalid latitude (too high)', () => {
      expect(() => new Coordinates(91, -74.006)).toThrow(
        'Latitude must be between -90 and 90 degrees',
      );
    });

    it('should throw error for invalid latitude (too low)', () => {
      expect(() => new Coordinates(-91, -74.006)).toThrow(
        'Latitude must be between -90 and 90 degrees',
      );
    });

    it('should throw error for invalid longitude (too high)', () => {
      expect(() => new Coordinates(40.7128, 181)).toThrow(
        'Longitude must be between -180 and 180 degrees',
      );
    });

    it('should throw error for invalid longitude (too low)', () => {
      expect(() => new Coordinates(40.7128, -181)).toThrow(
        'Longitude must be between -180 and 180 degrees',
      );
    });

    it('should accept boundary values', () => {
      expect(() => new Coordinates(90, 180)).not.toThrow();
      expect(() => new Coordinates(-90, -180)).not.toThrow();
      expect(() => new Coordinates(0, 0)).not.toThrow();
    });
  });

  describe('distanceTo', () => {
    it('should calculate distance between two points', () => {
      const nyc = new Coordinates(40.7128, -74.006);
      const la = new Coordinates(34.0522, -118.2437);

      const distance = nyc.distanceTo(la);

      // Distance between NYC and LA is approximately 3944 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    it('should return 0 for same coordinates', () => {
      const coords1 = new Coordinates(40.7128, -74.006);
      const coords2 = new Coordinates(40.7128, -74.006);

      expect(coords1.distanceTo(coords2)).toBe(0);
    });

    it('should handle coordinates across the date line', () => {
      const coords1 = new Coordinates(0, 179);
      const coords2 = new Coordinates(0, -179);

      const distance = coords1.distanceTo(coords2);

      // Should be approximately 222 km (2 degrees at equator)
      expect(distance).toBeGreaterThan(200);
      expect(distance).toBeLessThan(250);
    });
  });

  describe('equals', () => {
    it('should return true for equal coordinates', () => {
      const coords1 = new Coordinates(40.7128, -74.006);
      const coords2 = new Coordinates(40.7128, -74.006);
      expect(coords1.equals(coords2)).toBe(true);
    });

    it('should return false for different coordinates', () => {
      const coords1 = new Coordinates(40.7128, -74.006);
      const coords2 = new Coordinates(40.7129, -74.006);
      expect(coords1.equals(coords2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const coords = new Coordinates(40.7128, -74.006);
      expect(coords.equals(null as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      const coords = new Coordinates(40.7128, -74.006);
      expect(coords.toString()).toBe('40.7128, -74.0060');
    });

    it('should handle negative coordinates', () => {
      const coords = new Coordinates(-40.7128, 74.006);
      expect(coords.toString()).toBe('-40.7128, 74.0060');
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const coords = new Coordinates(40.7128, -74.006);
      const json = coords.toJSON();

      expect(json).toEqual({
        latitude: 40.7128,
        longitude: -74.006,
      });
    });
  });
});
