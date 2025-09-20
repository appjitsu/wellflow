/**
 * Coordinates Value Object
 * Represents geographic coordinates with validation
 */
export class Coordinates {
  private readonly latitude: number;
  private readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    this.validateCoordinates(latitude, longitude);
    this.latitude = latitude;
    this.longitude = longitude;
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
  }

  getLatitude(): number {
    return this.latitude;
  }

  getLongitude(): number {
    return this.longitude;
  }

  /**
   * Calculate distance to another coordinate point using Haversine formula
   * @param other Other coordinates
   * @returns Distance in kilometers
   */
  distanceTo(other: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(other.latitude - this.latitude);
    const dLon = this.toRadians(other.longitude - this.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this.latitude)) *
        Math.cos(this.toRadians(other.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  equals(other: Coordinates): boolean {
    if (!other) {
      return false;
    }
    return (
      this.latitude === other.latitude && this.longitude === other.longitude
    );
  }

  toString(): string {
    // Format to 4 decimal places, preserving trailing zeros when needed
    const lat = this.latitude.toFixed(4);
    const lng = this.longitude.toFixed(4);
    return `${lat}, ${lng}`;
  }

  toObject(): { latitude: number; longitude: number } {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  toJSON(): { latitude: number; longitude: number } {
    return this.toObject();
  }
}
