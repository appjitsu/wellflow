import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../config/app.config';
import { Reader } from '@maxmind/geoip2-node';
import * as path from 'path';
import * as fs from 'fs';

// Constants
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

// Interface for MaxMind Reader with city method
interface MaxMindReader {
  city(ipAddress: string): MaxMindCityResponse;
}

export interface MaxMindGeoData {
  country: {
    isoCode: string;
    name: string;
  };
  city?: {
    name: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  traits: {
    isAnonymousProxy: boolean;
    isSatelliteProvider: boolean;
  };
  registeredCountry: {
    isoCode: string;
    name: string;
  };
}

interface MaxMindCityResponse {
  country?: {
    isoCode?: string;
    names?: { en?: string };
  };
  city?: {
    names?: { en?: string };
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
  traits?: {
    isAnonymousProxy?: boolean;
    isSatelliteProvider?: boolean;
  };
  registeredCountry?: {
    isoCode?: string;
    names?: { en?: string };
  };
}
export interface MaxMindConfig {
  databasePath: string;
  enabled: boolean;
  highRiskCountries: Set<string>;
  trustedCountries: Set<string>;
}

/**
 * MaxMind GeoIP Service
 *
 * Provides geographic and proxy detection for IP addresses
 * Uses local GeoLite2 database (free) or GeoIP2 database (paid)
 */
@Injectable()
export class MaxMindService {
  private readonly logger = new Logger(MaxMindService.name);
  private readonly config: MaxMindConfig;
  private reader: Reader | null = null;

  constructor(private readonly configService: AppConfigService) {
    const dbPath = this.configService.get<string>('MAXMIND_DB_PATH');
    this.config = {
      databasePath:
        dbPath || path.join(process.cwd(), 'data', 'GeoLite2-City.mmdb'),
      enabled: true,
      // High-risk countries based on common threat intelligence
      highRiskCountries: new Set([
        'CN',
        'RU',
        'KP',
        'IR',
        'SY',
        'AF',
        'IQ',
        'LY',
        'SO',
        'SD',
        'YE',
        'MM',
        'BY',
        'VE',
        'CU',
        'ZW',
        'ER',
        'TD',
        'CF',
        'SS',
      ]),
      // Trusted countries (typically allies with strong cybersecurity)
      trustedCountries: new Set([
        'US',
        'CA',
        'GB',
        'AU',
        'NZ',
        'DE',
        'FR',
        'NL',
        'SE',
        'NO',
        'DK',
        'FI',
        'CH',
        'AT',
        'BE',
        'LU',
        'IE',
        'IS',
        'JP',
        'KR',
        'SG',
        'IL',
        'EE',
        'LV',
        'LT',
        'CZ',
        'SK',
        'SI',
        'PL',
        'HU',
      ]),
    };
  }

  /**
   * Initialize the MaxMind database reader
   */
  private async initializeReader(): Promise<void> {
    try {
      // Check if database file exists
      try {
        await fs.promises.access(this.config.databasePath, fs.constants.R_OK);
      } catch {
        this.logger.warn('MaxMind database not found', {
          path: this.config.databasePath,
          message:
            'Download GeoLite2-City.mmdb from MaxMind to enable geo-based reputation scoring',
        });
        this.config.enabled = false;
        return;
      }

      this.reader = await Reader.open(this.config.databasePath);
      this.logger.log('MaxMind database loaded successfully', {
        path: this.config.databasePath,
      });
    } catch (error) {
      this.logger.error('Failed to initialize MaxMind reader', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        path: this.config.databasePath,
      });
      this.config.enabled = false;
    }
  }

  /**
   * Lookup IP address geographic information
   */
  async lookupIP(ipAddress: string): Promise<MaxMindGeoData | null> {
    if (!this.config.enabled) {
      this.logger.debug('MaxMind service disabled');
      return null;
    }

    // Initialize reader if not already done
    if (!this.reader) {
      await this.initializeReader();
      if (!this.reader) {
        this.logger.debug('Failed to initialize MaxMind reader');
        return null;
      }
    }

    try {
      // Type assertion needed due to incomplete TypeScript definitions
      const response = (this.reader as MaxMindReader).city(ipAddress);

      const geoData: MaxMindGeoData = {
        country: {
          isoCode: response.country?.isoCode || 'UNKNOWN',
          name: response.country?.names?.en || 'Unknown',
        },
        city: response.city?.names?.en
          ? {
              name: response.city.names.en,
            }
          : undefined,
        location:
          response.location?.latitude && response.location?.longitude
            ? {
                latitude: response.location.latitude,
                longitude: response.location.longitude,
              }
            : undefined,
        traits: {
          isAnonymousProxy: response.traits?.isAnonymousProxy || false,
          isSatelliteProvider: response.traits?.isSatelliteProvider || false,
        },
        registeredCountry: {
          isoCode:
            response.registeredCountry?.isoCode ||
            response.country?.isoCode ||
            'UNKNOWN',
          name:
            response.registeredCountry?.names?.en ||
            response.country?.names?.en ||
            'Unknown',
        },
      };

      this.logger.debug('MaxMind lookup completed', {
        ipAddress,
        country: geoData.country.isoCode,
        isProxy: geoData.traits.isAnonymousProxy,
      });

      return geoData;
    } catch (error) {
      this.logger.error('Error looking up IP with MaxMind', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return null;
    }
  }

  /**
   * Convert MaxMind data to reputation factor
   */
  convertToReputationFactor(data: MaxMindGeoData): {
    type: string;
    impact: number;
    description: string;
    confidence: number;
  } {
    let impact = 0;
    let description = '';
    let confidence = 0.8; // High confidence for geographic data

    const countryCode = data.country.isoCode;
    const countryName = data.country.name;

    // Check for anonymous proxy
    if (data.traits.isAnonymousProxy) {
      impact += 20;
      description += `Anonymous proxy detected. `;
      confidence = 0.9;
    }

    // Check country risk level
    if (this.config.highRiskCountries.has(countryCode)) {
      impact += 15;
      description += `High-risk country: ${countryName}. `;
    } else if (this.config.trustedCountries.has(countryCode)) {
      impact -= 5; // Slight positive impact for trusted countries
      description += `Trusted country: ${countryName}. `;
    } else {
      description += `Country: ${countryName}. `;
    }

    // Check for country mismatch (registered vs actual)
    if (data.registeredCountry.isoCode !== countryCode) {
      impact += 5;
      description += `Country mismatch (registered: ${data.registeredCountry.name}). `;
    }

    if (description === '') {
      description = `Geographic location: ${countryName}`;
    }

    return {
      type: 'geographic',
      impact,
      description: description.trim(),
      confidence,
    };
  }

  /**
   * Check if IP is from a high-risk country
   */
  isHighRiskCountry(countryCode: string): boolean {
    return this.config.highRiskCountries.has(countryCode);
  }

  /**
   * Check if IP is from a trusted country
   */
  isTrustedCountry(countryCode: string): boolean {
    return this.config.trustedCountries.has(countryCode);
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled && this.reader !== null;
  }

  /**
   * Get service status
   */
  getStatus(): {
    enabled: boolean;
    databasePath: string;
    databaseExists: boolean;
    readerInitialized: boolean;
  } {
    return {
      enabled: this.config.enabled,
      databasePath: this.config.databasePath,
      databaseExists: (() => {
        try {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          return fs.existsSync(this.config.databasePath);
        } catch {
          return false;
        }
      })(),
      readerInitialized: this.reader !== null,
    };
  }
}
