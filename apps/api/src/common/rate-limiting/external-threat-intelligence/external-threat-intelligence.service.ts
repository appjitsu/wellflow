import { Injectable, Logger } from '@nestjs/common';
import { AbuseIPDBService, AbuseIPDBResponse } from './abuse-ipdb.service';
import { MaxMindService, MaxMindGeoData } from './maxmind.service';
import { ThreatFeedService } from './threat-feed.service';

const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

// Type definitions for Promise.allSettled results
type AbuseIPDBResult = PromiseSettledResult<unknown>;
type MaxMindResult = PromiseSettledResult<unknown>;
type ThreatFeedResult = PromiseSettledResult<boolean | null>;
type ThreatCheckResults = [AbuseIPDBResult, MaxMindResult, ThreatFeedResult];

export interface ExternalThreatData {
  ipAddress: string;
  abuseIPDB?: AbuseIPDBResponse;
  maxMind?: MaxMindGeoData;
  threatFeeds?: {
    isThreat: boolean;
    sources: string[];
    description: string;
  };
  timestamp: Date;
}

export interface ExternalReputationFactor {
  type: string;
  impact: number;
  description: string;
  confidence: number;
  source: string;
}

/**
 * External Threat Intelligence Service
 *
 * Coordinates multiple external threat intelligence sources
 * to provide comprehensive IP reputation data
 */
@Injectable()
export class ExternalThreatIntelligenceService {
  private readonly logger = new Logger(ExternalThreatIntelligenceService.name);

  constructor(
    private readonly abuseIPDB: AbuseIPDBService,
    private readonly maxMind: MaxMindService,
    private readonly threatFeeds: ThreatFeedService,
  ) {}

  /**
   * Get comprehensive threat intelligence for an IP address
   */
  async analyzeIP(ipAddress: string): Promise<ExternalThreatData> {
    const startTime = Date.now();

    try {
      const threatChecks = await this.runParallelThreatChecks(ipAddress);
      const result = this.processThreatCheckResults(ipAddress, threatChecks);

      this.logAnalysisCompletion(ipAddress, startTime, result);
      return result;
    } catch (error) {
      this.logger.error('Error in external threat intelligence analysis', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        ipAddress,
      });

      return {
        ipAddress,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Run all threat intelligence checks in parallel
   */
  private async runParallelThreatChecks(
    ipAddress: string,
  ): Promise<ThreatCheckResults> {
    const abusePromise: Promise<unknown> = this.abuseIPDB.isEnabled()
      ? this.abuseIPDB.checkIP(ipAddress)
      : Promise.resolve(null);

    const maxMindPromise: Promise<unknown> = this.maxMind.isEnabled()
      ? this.maxMind.lookupIP(ipAddress)
      : Promise.resolve(null);

    const threatPromise: Promise<boolean | null> = this.threatFeeds.isEnabled()
      ? Promise.resolve(this.threatFeeds.isIPInThreatFeeds(ipAddress))
      : Promise.resolve(null);

    return Promise.allSettled([abusePromise, maxMindPromise, threatPromise]);
  }

  /**
   * Process the results from parallel threat checks
   */
  private processThreatCheckResults(
    ipAddress: string,
    [abuseData, geoData, threatData]: ThreatCheckResults,
  ): ExternalThreatData {
    const result: ExternalThreatData = {
      ipAddress,
      timestamp: new Date(),
    };

    this.processAbuseIPDBResult(ipAddress, abuseData, result);
    this.processMaxMindResult(ipAddress, geoData, result);
    this.processThreatFeedResult(ipAddress, threatData, result);

    return result;
  }

  /**
   * Process AbuseIPDB check result
   */
  private processAbuseIPDBResult(
    ipAddress: string,
    abuseData: AbuseIPDBResult,
    result: ExternalThreatData,
  ): void {
    if (abuseData.status === 'fulfilled' && abuseData.value) {
      result.abuseIPDB = abuseData.value as AbuseIPDBResponse;
    } else if (abuseData.status === 'rejected') {
      this.logger.warn('AbuseIPDB check failed', {
        ipAddress,
        error: abuseData.reason as unknown,
      });
    }
  }

  /**
   * Process MaxMind lookup result
   */
  private processMaxMindResult(
    ipAddress: string,
    geoData: MaxMindResult,
    result: ExternalThreatData,
  ): void {
    if (geoData.status === 'fulfilled' && geoData.value) {
      result.maxMind = geoData.value as MaxMindGeoData;
    } else if (geoData.status === 'rejected') {
      this.logger.warn('MaxMind lookup failed', {
        ipAddress,
        error: geoData.reason as unknown,
      });
    }
  }

  /**
   * Process threat feed check result
   */
  private processThreatFeedResult(
    ipAddress: string,
    threatData: ThreatFeedResult,
    result: ExternalThreatData,
  ): void {
    this.logger.debug('Threat feed check result', {
      ipAddress,
      status: threatData.status,
      value:
        threatData.status === 'fulfilled'
          ? (threatData.value as unknown)
          : null,
      reason:
        threatData.status === 'rejected'
          ? (threatData.reason as unknown)
          : undefined,
    });

    if (threatData.status === 'fulfilled' && threatData.value !== null) {
      result.threatFeeds = {
        isThreat: Boolean(threatData.value),
        sources: threatData.value ? ['threat-feeds'] : [],
        description: threatData.value
          ? 'IP found in threat intelligence feeds'
          : 'IP not found in threat feeds',
      };
    } else if (threatData.status === 'rejected') {
      this.logger.warn('Threat feed check failed', {
        ipAddress,
        error: threatData.reason as unknown,
      });
    }
  }

  /**
   * Log analysis completion details
   */
  private logAnalysisCompletion(
    ipAddress: string,
    startTime: number,
    result: ExternalThreatData,
  ): void {
    const duration = Date.now() - startTime;
    this.logger.debug('External threat intelligence analysis completed', {
      ipAddress,
      duration,
      sources: {
        abuseIPDB: !!result.abuseIPDB,
        maxMind: !!result.maxMind,
        threatFeeds: !!result.threatFeeds,
      },
    });
  }

  /**
   * Convert external threat data to reputation factors
   */
  convertToReputationFactors(
    data: ExternalThreatData,
  ): ExternalReputationFactor[] {
    const factors: ExternalReputationFactor[] = [];

    this.logger.debug('Converting external threat data to reputation factors', {
      ipAddress: data.ipAddress,
      hasAbuseIPDB: !!data.abuseIPDB,
      hasMaxMind: !!data.maxMind,
      hasThreatFeeds: !!data.threatFeeds,
      threatFeedsData: data.threatFeeds,
    });

    try {
      // Process AbuseIPDB data
      if (data.abuseIPDB) {
        const factor = this.abuseIPDB.convertToReputationFactor(data.abuseIPDB);
        factors.push({
          ...factor,
          source: 'AbuseIPDB',
        });
      }

      // Process MaxMind geographic data
      if (data.maxMind) {
        const factor = this.maxMind.convertToReputationFactor(data.maxMind);
        factors.push({
          ...factor,
          source: 'MaxMind',
        });
      }

      // Process threat feed data
      if (data.threatFeeds && data.threatFeeds.isThreat) {
        factors.push({
          type: 'threat-feed',
          impact: 30, // High impact for known threat feeds
          description: data.threatFeeds.description,
          confidence: 0.9, // High confidence for curated threat feeds
          source: 'ThreatFeeds',
        });
      }

      return factors;
    } catch (error) {
      this.logger.error(
        'Error converting external data to reputation factors',
        {
          error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
          ipAddress: data.ipAddress,
        },
      );
      return [];
    }
  }

  /**
   * Get service status for all external sources
   */
  getServiceStatus(): {
    abuseIPDB: {
      enabled: boolean;
      requestInfo?: unknown;
    };
    maxMind: {
      enabled: boolean;
      status?: unknown;
    };
    threatFeeds: {
      enabled: boolean;
      stats?: unknown;
    };
  } {
    return {
      abuseIPDB: {
        enabled: this.abuseIPDB.isEnabled(),
        requestInfo: this.abuseIPDB.isEnabled()
          ? this.abuseIPDB.getRequestInfo()
          : undefined,
      },
      maxMind: {
        enabled: this.maxMind.isEnabled(),
        status: this.maxMind.isEnabled() ? this.maxMind.getStatus() : undefined,
      },
      threatFeeds: {
        enabled: this.threatFeeds.isEnabled(),
      },
    };
  }

  /**
   * Get detailed statistics from all sources
   */
  async getDetailedStats(): Promise<{
    abuseIPDB: unknown;
    maxMind: unknown;
    threatFeeds: unknown;
  }> {
    try {
      const [threatFeedStats] = await Promise.allSettled([
        this.threatFeeds.isEnabled()
          ? this.threatFeeds.getFeedStats()
          : Promise.resolve({}),
      ]);

      return {
        abuseIPDB: this.abuseIPDB.isEnabled()
          ? this.abuseIPDB.getRequestInfo()
          : null,
        maxMind: this.maxMind.isEnabled() ? this.maxMind.getStatus() : null,
        threatFeeds:
          threatFeedStats.status === 'fulfilled' ? threatFeedStats.value : null,
      };
    } catch (error) {
      this.logger.error('Error getting detailed stats', {
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
      return {
        abuseIPDB: null,
        maxMind: null,
        threatFeeds: null,
      };
    }
  }

  /**
   * Check if any external services are available
   */
  hasAvailableServices(): boolean {
    return (
      this.abuseIPDB.isEnabled() ||
      this.maxMind.isEnabled() ||
      this.threatFeeds.isEnabled()
    );
  }

  /**
   * Get a summary of available external intelligence sources
   */
  getAvailableSources(): string[] {
    const sources: string[] = [];

    if (this.abuseIPDB.isEnabled()) sources.push('AbuseIPDB');
    if (this.maxMind.isEnabled()) sources.push('MaxMind GeoIP');
    if (this.threatFeeds.isEnabled()) sources.push('Threat Feeds');

    return sources;
  }
}
