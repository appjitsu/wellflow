import { Coordinates } from './coordinates';

/**
 * Location Value Object
 * Represents a physical location with address and coordinates
 */
export class Location {
  private readonly coordinates: Coordinates;
  private readonly address?: string;
  private readonly county?: string;
  private readonly state?: string;
  private readonly country: string;

  constructor(
    coordinates: Coordinates,
    options?: {
      address?: string;
      county?: string;
      state?: string;
      country?: string;
    },
  ) {
    // Validate coordinates are provided
    if (!coordinates) {
      throw new Error('Coordinates are required');
    }

    // Validate that provided strings are not empty
    if (options?.address === '') {
      throw new Error('Address cannot be empty if provided');
    }
    if (options?.county === '') {
      throw new Error('County cannot be empty if provided');
    }
    if (options?.state === '') {
      throw new Error('State cannot be empty if provided');
    }
    if (options?.country === '') {
      throw new Error('Country cannot be empty if provided');
    }

    this.coordinates = coordinates;
    this.address = options?.address;
    this.county = options?.county;
    this.state = options?.state;
    this.country = options?.country || 'US'; // Default to US for oil & gas operations
  }

  getCoordinates(): Coordinates {
    return this.coordinates;
  }

  getAddress(): string | undefined {
    return this.address;
  }

  getCounty(): string | undefined {
    return this.county;
  }

  getState(): string | undefined {
    return this.state;
  }

  getCountry(): string {
    return this.country;
  }

  /**
   * Get full address string
   */
  getFullAddress(): string {
    // Only include country if other address components are present
    const addressParts = [this.address, this.county, this.state].filter(
      Boolean,
    );
    if (addressParts.length > 0) {
      addressParts.push(this.country);
    }
    return addressParts.join(', ');
  }

  /**
   * Calculate distance to another location
   */
  distanceTo(other: Location): number {
    return this.coordinates.distanceTo(other.coordinates);
  }

  equals(other: Location): boolean {
    if (!other) {
      return false;
    }
    return (
      this.coordinates.equals(other.coordinates) &&
      this.address === other.address &&
      this.county === other.county &&
      this.state === other.state &&
      this.country === other.country
    );
  }

  toString(): string {
    const fullAddress = this.getFullAddress();
    if (fullAddress) {
      return `${fullAddress} (${this.coordinates.toString()})`;
    }
    return this.coordinates.toString();
  }

  toObject(): {
    coordinates: { latitude: number; longitude: number };
    address?: string;
    county?: string;
    state?: string;
    country: string;
  } {
    return {
      coordinates: this.coordinates.toObject(),
      address: this.address,
      county: this.county,
      state: this.state,
      country: this.country,
    };
  }

  toJSON(): {
    coordinates: { latitude: number; longitude: number };
    address?: string;
    county?: string;
    state?: string;
    country: string;
  } {
    return this.toObject();
  }
}
