import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../../config/app.config';
import axios, { AxiosInstance } from 'axios';

// Constants
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

export interface AbuseIPDBResponse {
  ipAddress: string;
  isPublic: boolean;
  ipVersion: number;
  isWhitelisted: boolean;
  abuseConfidencePercentage: number;
  countryCode: string;
  usageType: string;
  isp: string;
  domain: string;
  totalReports: number;
  numDistinctUsers: number;
  lastReportedAt: string | null;
}

interface AbuseIPDBApiResponse {
  data: AbuseIPDBResponse;
}

export interface AbuseIPDBRequestInfo {
  count: number;
  limit: number;
  remaining: number;
  resetDate: string;
}

export interface AbuseIPDBConfig {
  apiKey?: string;
  baseUrl: string;
  timeout: number;
  maxRequestsPerDay: number;
  enabled: boolean;
}

/**
 * AbuseIPDB Service
 *
 * Integrates with AbuseIPDB API to check IP reputation
 * Free tier: 1000 requests/day
 */
@Injectable()
export class AbuseIPDBService {
  private readonly logger = new Logger(AbuseIPDBService.name);
  private readonly httpClient: AxiosInstance;
  private readonly config: AbuseIPDBConfig;
  private requestCount = 0;
  private lastResetDate = new Date().toDateString();

  constructor(private readonly configService: AppConfigService) {
    const apiKey = this.configService.get<string>('ABUSEIPDB_API_KEY');
    this.config = {
      apiKey,
      baseUrl: 'https://api.abuseipdb.com/api/v2',
      timeout: 5000,
      maxRequestsPerDay: 1000,
      enabled: !!apiKey,
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        Key: this.config.apiKey || '',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Check IP reputation with AbuseIPDB
   */
  async checkIP(ipAddress: string): Promise<AbuseIPDBResponse | null> {
    if (!this.config.enabled) {
      this.logger.debug('AbuseIPDB service disabled - no API key provided');
      return null;
    }

    if (!this.canMakeRequest()) {
      this.logger.warn('AbuseIPDB daily request limit reached');
      return null;
    }

    try {
      const response = await this.httpClient.get('/check', {
        params: {
          ipAddress,
          maxAgeInDays: 90,
          verbose: true,
        },
      });

      this.incrementRequestCount();

      const responseData = response.data as AbuseIPDBApiResponse;
      if (
        !responseData ||
        typeof responseData !== 'object' ||
        !('data' in responseData)
      ) {
        throw new Error('Invalid response format from AbuseIPDB');
      }

      const data = responseData.data;

      this.logger.debug('AbuseIPDB check completed', {
        ipAddress,
        abuseConfidence: data.abuseConfidencePercentage,
        totalReports: data.totalReports,
      });

      return data;
    } catch (error) {
      this.logger.error('Error checking IP with AbuseIPDB', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });
      return null;
    }
  }

  /**
   * Convert AbuseIPDB response to reputation factor
   */
  convertToReputationFactor(data: AbuseIPDBResponse): {
    type: string;
    impact: number;
    description: string;
    confidence: number;
  } {
    const confidence = data.abuseConfidencePercentage;
    let impact = 0;
    let description = '';

    if (confidence >= 75) {
      impact = 35; // High impact for high confidence abuse
      description = `High abuse confidence: ${confidence}% (${data.totalReports} reports)`;
    } else if (confidence >= 50) {
      impact = 25; // Medium impact
      description = `Medium abuse confidence: ${confidence}% (${data.totalReports} reports)`;
    } else if (confidence >= 25) {
      impact = 15; // Low impact
      description = `Low abuse confidence: ${confidence}% (${data.totalReports} reports)`;
    } else if (data.totalReports > 0) {
      impact = 5; // Minimal impact for reported but low confidence
      description = `Reported but low confidence: ${confidence}% (${data.totalReports} reports)`;
    } else {
      // No impact for clean IPs
      description = `Clean IP: No abuse reports`;
    }

    return {
      type: 'abuseipdb',
      impact,
      description,
      confidence: confidence / 100, // Convert to 0-1 scale
    };
  }

  /**
   * Check if we can make another request (rate limiting)
   */
  private canMakeRequest(): boolean {
    const today = new Date().toDateString();

    // Reset counter if it's a new day
    if (today !== this.lastResetDate) {
      this.requestCount = 0;
      this.lastResetDate = today;
    }

    return this.requestCount < this.config.maxRequestsPerDay;
  }

  /**
   * Increment request counter
   */
  private incrementRequestCount(): void {
    this.requestCount++;
  }

  /**
   * Get current request count and limit info
   */
  getRequestInfo(): {
    count: number;
    limit: number;
    remaining: number;
    resetDate: string;
  } {
    return {
      count: this.requestCount,
      limit: this.config.maxRequestsPerDay,
      remaining: this.config.maxRequestsPerDay - this.requestCount,
      resetDate: this.lastResetDate,
    };
  }

  /**
   * Check if service is enabled and configured
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}
