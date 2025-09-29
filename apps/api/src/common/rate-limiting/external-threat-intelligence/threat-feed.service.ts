import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { readFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_UPDATE_INTERVAL = '0 */6 * * *';
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

interface IPSet {
  contains(ip: string): boolean;
}

interface IPCIDRInstance {
  toArray(): string[];
}

interface IPCIDRClass {
  isValidCIDR(cidr: string): boolean;
  new (cidr: string): IPCIDRInstance;
}

// Simple IP set implementation for now
class SimpleIPSet implements IPSet {
  private ips: Set<string> = new Set();

  constructor(ips: string[]) {
    ips.forEach((ip) => this.ips.add(ip.trim()));
  }

  contains(ip: string): boolean {
    return this.ips.has(ip);
  }
}

export interface ThreatFeed {
  name: string;
  url: string;
  updateInterval: string; // cron expression for Bull MQ scheduling
  enabled: boolean;
  description: string;
  format: 'ip' | 'cidr' | 'mixed'; // Format of the feed data
  parser: 'line' | 'json'; // How to parse the feed
  skipComments?: boolean; // Skip lines starting with comment prefix
  commentPrefix?: string; // Comment prefix (e.g., '#')
}

export interface ThreatFeedStats {
  [feedName: string]: {
    ipCount: number;
    lastUpdated: Date | null;
    enabled: boolean;
  };
}

export interface ThreatFeedConfig {
  enabled: boolean;
  cacheTTL: number; // seconds
  updateInterval: string;
  feeds: ThreatFeed[];
  cachePrefix?: string; // For backward compatibility
  timeout?: number; // For backward compatibility
}

/**
 * Threat Feed Service
 *
 * Downloads and manages IP blacklists from various threat intelligence sources
 * Uses load-ip-set for reliable parsing and updates feeds on schedule
 */
@Injectable()
export class ThreatFeedService {
  private readonly logger = new Logger(ThreatFeedService.name);
  private config: ThreatFeedConfig = {
    enabled: false,
    cacheTTL: 86400,
    updateInterval: DEFAULT_UPDATE_INTERVAL,
    feeds: [],
  };
  private ipSets: Map<string, IPSet> = new Map(); // Store loaded IP sets in memory

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redis: Redis | null,
  ) {
    // Load configuration from JSON file
    try {
      const configPath = join(process.cwd(), 'config/threat-feeds.json');
      const configData = readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData) as ThreatFeedConfig;
      this.logger.log(
        `Loaded threat feeds configuration: ${this.config.feeds.length} feeds configured`,
      );
    } catch (error: unknown) {
      this.logger.error(
        'Failed to load threat feeds configuration, using defaults',
        error,
      );
      // Fallback to minimal default configuration
      this.config = {
        enabled: true,
        cacheTTL: 86400,
        updateInterval: DEFAULT_UPDATE_INTERVAL,
        feeds: [
          {
            name: 'blocklist-de',
            url: 'https://lists.blocklist.de/lists/all.txt',
            updateInterval: DEFAULT_UPDATE_INTERVAL,
            enabled: true,
            description: 'Blocklist.de All Malicious IPs',
            format: 'ip',
            parser: 'line',
          },
        ],
      };
    }

    this.logger.log('Threat Feed Service initialized (MAIN API)', {
      totalFeeds: this.config.feeds.length,
      enabledFeeds: this.config.feeds.filter((f) => f.enabled).length,
      enabled: this.config.enabled,
    });
  }

  /**
   * Update a specific threat feed using load-ip-set
   */
  async updateFeed(feed: ThreatFeed): Promise<void> {
    if (!this.validateFeedUpdate(feed)) {
      return;
    }

    const startTime = Date.now();
    this.logger.log('Updating threat feed', { feed: feed.name, url: feed.url });

    try {
      const ips = await this.fetchAndParseFeed(feed);
      this.updateInMemoryIPSet(feed.name, ips);
      await this.storeIPsInRedis(feed, ips);
      await this.storeFeedMetadata(feed, ips);

      this.logUpdateSuccess(feed.name, ips.length, startTime);
    } catch (error: unknown) {
      this.logger.error('Failed to update threat feed', {
        feed: feed.name,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
      throw error;
    }
  }

  /**
   * Validate if feed update should proceed
   */
  private validateFeedUpdate(feed: ThreatFeed): boolean {
    if (!this.redis) {
      this.logger.warn('Redis not available, skipping feed update', {
        feed: feed.name,
      });
      return false;
    }

    if (!feed.enabled) {
      this.logger.debug('Feed disabled, skipping update', { feed: feed.name });
      return false;
    }

    return true;
  }

  /**
   * Fetch and parse threat feed data
   */
  private async fetchAndParseFeed(feed: ThreatFeed): Promise<string[]> {
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'WellFlow-Security-Scanner/1.0',
      },
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    return this.parseIPsFromFeed(text, feed);
  }

  /**
   * Update in-memory IP set
   */
  private updateInMemoryIPSet(feedName: string, ips: string[]): void {
    const ipSet = new SimpleIPSet(ips);
    this.ipSets.set(feedName, ipSet);
  }

  /**
   * Store IPs in Redis for cross-process access
   */
  private async storeIPsInRedis(
    feed: ThreatFeed,
    ips: string[],
  ): Promise<void> {
    const blacklistKey = `threat-intelligence:blacklist:${feed.name}`;

    this.logger.debug('Storing IPs in Redis (JOB PROCESSOR)', {
      feedName: feed.name,
      blacklistKey,
      ipCount: ips.length,
      hasRedis: !!this.redis,
      redisType: this.redis ? this.redis.constructor.name : 'null',
    });

    if (ips.length > 0) {
      await this.storeIPsInBatches(feed.name, blacklistKey, ips);
    } else {
      this.logger.debug('No IPs to store in Redis (JOB PROCESSOR)', {
        feedName: feed.name,
        blacklistKey,
      });
    }
  }

  /**
   * Store IPs in Redis using batched pipeline operations
   */
  private async storeIPsInBatches(
    feedName: string,
    blacklistKey: string,
    ips: string[],
  ): Promise<void> {
    if (!this.redis) {
      throw new Error('Redis connection not available');
    }

    try {
      // Clear existing data
      const delResult = await this.redis.del(blacklistKey);

      // Use pipeline for better performance with large datasets
      const pipeline = this.redis.pipeline();
      const batchSize = 1000;
      let totalAdded = 0;

      for (let i = 0; i < ips.length; i += batchSize) {
        const batch = ips.slice(i, i + batchSize);
        pipeline.sadd(blacklistKey, ...batch);
        totalAdded += batch.length;
      }

      // Set expiration
      pipeline.expire(blacklistKey, this.config.cacheTTL);

      // Execute pipeline
      const results = await pipeline.exec();

      this.logger.debug('Redis storage results (JOB PROCESSOR)', {
        feedName,
        blacklistKey,
        delResult,
        totalAdded,
        batchCount: Math.ceil(ips.length / batchSize),
        pipelineResults: results?.length || 0,
        cacheTTL: this.config.cacheTTL,
      });
    } catch (error: unknown) {
      this.logger.error('Redis storage failed (JOB PROCESSOR)', {
        feedName,
        blacklistKey,
        error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
      });
    }
  }

  /**
   * Store feed metadata in Redis
   */
  private async storeFeedMetadata(
    feed: ThreatFeed,
    ips: string[],
  ): Promise<void> {
    if (!this.redis) {
      throw new Error('Redis connection not available');
    }

    const feedKey = `${this.config.cachePrefix || 'threat:feed'}:${feed.name}`;
    const feedData = {
      lastUpdated: new Date().toISOString(),
      ipCount: ips.length,
      source: feed.url,
      loaded: true,
      description: feed.description,
    };

    await this.redis.setex(
      feedKey,
      this.config.cacheTTL,
      JSON.stringify(feedData),
    );
  }

  /**
   * Log successful feed update
   */
  private logUpdateSuccess(
    feedName: string,
    ipCount: number,
    startTime: number,
  ): void {
    const duration = Date.now() - startTime;
    this.logger.log('Threat feed updated successfully', {
      feed: feedName,
      ipCount,
      duration: `${duration}ms`,
    });
  }

  /**
   * Parse IPs from feed text based on feed configuration
   */
  private async parseIPsFromFeed(
    text: string,
    feed: ThreatFeed,
  ): Promise<string[]> {
    const filteredLines = this.preprocessFeedText(text, feed);
    const IPCIDR = await this.loadCIDRModule(feed);
    const ips = this.extractIPsFromLines(filteredLines, feed, IPCIDR);

    this.logParsingResults(feed, text, filteredLines, ips);
    return ips;
  }

  /**
   * Preprocess feed text by splitting and filtering lines
   */
  private preprocessFeedText(text: string, feed: ThreatFeed): string[] {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const commentPrefix = feed.commentPrefix || '#';
    return feed.skipComments
      ? lines.filter((line) => !line.startsWith(commentPrefix))
      : lines.filter((line) => !line.startsWith('#'));
  }

  /**
   * Load CIDR module if needed for the feed format
   */
  private async loadCIDRModule(feed: ThreatFeed): Promise<IPCIDRClass | null> {
    if (feed.format === 'cidr' || feed.format === 'mixed') {
      try {
        const ipCidrModule = await import('ip-cidr');
        return ipCidrModule.default as IPCIDRClass;
      } catch (error: unknown) {
        this.logger.error('Failed to import ip-cidr module', {
          feed: feed.name,
          error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        });
        // Fall back to IP-only parsing
        feed.format = 'ip';
      }
    }
    return null;
  }

  /**
   * Extract IPs from filtered lines based on feed format
   */
  private extractIPsFromLines(
    lines: string[],
    feed: ThreatFeed,
    IPCIDR: IPCIDRClass | null,
  ): string[] {
    const ips: string[] = [];

    for (const line of lines) {
      try {
        const extractedIPs = this.processLine(line, feed, IPCIDR);
        ips.push(...extractedIPs);
      } catch (error: unknown) {
        this.logger.debug('Skipping invalid IP/CIDR entry', {
          feed: feed.name,
          line,
          error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        });
      }
    }

    return ips;
  }

  /**
   * Process a single line based on feed format
   */
  private processLine(
    line: string,
    feed: ThreatFeed,
    IPCIDR: IPCIDRClass | null,
  ): string[] {
    switch (feed.format) {
      case 'ip':
        return this.processIPLine(line);
      case 'cidr':
        return this.processCIDRLine(line, IPCIDR);
      case 'mixed':
        return this.processMixedLine(line, IPCIDR);
      default:
        return [];
    }
  }

  /**
   * Process line as individual IP address
   */
  private processIPLine(line: string): string[] {
    return this.isValidIP(line) ? [line] : [];
  }

  /**
   * Process line as CIDR block
   */
  private processCIDRLine(line: string, IPCIDR: IPCIDRClass | null): string[] {
    if (!IPCIDR || !IPCIDR.isValidCIDR(line)) {
      return [];
    }
    const cidr = new IPCIDR(line);
    return cidr.toArray();
  }

  /**
   * Process line as mixed format (IP or CIDR)
   */
  private processMixedLine(line: string, IPCIDR: IPCIDRClass | null): string[] {
    if (this.isValidIP(line)) {
      return [line];
    }
    if (IPCIDR && IPCIDR.isValidCIDR(line)) {
      const cidr = new IPCIDR(line);
      return cidr.toArray();
    }
    return [];
  }

  /**
   * Log parsing results for debugging
   */
  private logParsingResults(
    feed: ThreatFeed,
    originalText: string,
    filteredLines: string[],
    ips: string[],
  ): void {
    const totalLines = originalText.split('\n').length;
    this.logger.debug('Parsed IPs from feed', {
      feed: feed.name,
      format: feed.format,
      totalLines,
      filteredLines: filteredLines.length,
      parsedIPs: ips.length,
    });
  }

  /**
   * Simple IP validation
   */
  private isValidIP(ip: string): boolean {
    // Simple validation - just check if it looks like an IP
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
  }

  /**
   * Check if an IP address is in any of the loaded threat feeds
   */
  isIPInThreatFeeds(ipAddress: string): boolean {
    for (const [feedName, ipSet] of this.ipSets.entries()) {
      try {
        if (ipSet && ipSet.contains && ipSet.contains(ipAddress)) {
          this.logger.debug('IP found in threat feed', {
            ipAddress,
            feedName,
          });
          return true;
        }
      } catch (error: unknown) {
        this.logger.warn('Error checking IP against threat feed', {
          feedName,
          ipAddress,
          error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        });
      }
    }
    return false;
  }

  /**
   * Get threat feed information for an IP address
   */
  getThreatFeedInfo(ipAddress: string): {
    isBlacklisted: boolean;
    feeds: string[];
    lastChecked: string;
  } {
    const matchingFeeds: string[] = [];

    for (const [feedName, ipSet] of this.ipSets.entries()) {
      try {
        if (ipSet && ipSet.contains && ipSet.contains(ipAddress)) {
          matchingFeeds.push(feedName);
        }
      } catch (error: unknown) {
        this.logger.warn('Error checking IP against threat feed', {
          feedName,
          ipAddress,
          error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        });
      }
    }

    return {
      isBlacklisted: matchingFeeds.length > 0,
      feeds: matchingFeeds,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * Get feed status information
   */
  getFeedStatus(): {
    totalFeeds: number;
    loadedFeeds: number;
    feeds: Array<{
      name: string;
      description: string;
      loaded: boolean;
      lastUpdated?: string;
    }>;
  } {
    const feedStatus = this.config.feeds.map((feed) => ({
      name: feed.name,
      description: feed.description,
      loaded: this.ipSets.has(feed.name),
      lastUpdated: undefined, // Could be retrieved from Redis if needed
    }));

    return {
      totalFeeds: this.config.feeds.length,
      loadedFeeds: this.ipSets.size,
      feeds: feedStatus,
    };
  }

  /**
   * Manually trigger feed update (useful for testing)
   */
  async triggerFeedUpdate(feedName?: string): Promise<void> {
    this.logger.log('🔄 Triggering threat feed update', {
      feedName: feedName || 'ALL_FEEDS',
      timestamp: new Date().toISOString(),
    });

    if (feedName) {
      const feed = this.config.feeds.find((f) => f.name === feedName);
      if (feed) {
        await this.updateFeed(feed);
        this.logger.log('✅ Single feed update completed', { feedName });
      } else {
        this.logger.error('❌ Feed not found', { feedName });
        throw new Error(`Feed not found: ${feedName}`);
      }
    } else {
      // Update all feeds
      const enabledFeeds = this.config.feeds.filter((feed) => feed.enabled);
      this.logger.log('🔄 Starting update for all enabled feeds', {
        totalFeeds: this.config.feeds.length,
        enabledFeeds: enabledFeeds.length,
      });

      const updatePromises = enabledFeeds.map((feed) => this.updateFeed(feed));
      const results = await Promise.allSettled(updatePromises);

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      this.logger.log('✅ All feeds update completed', {
        successful,
        failed,
        total: enabledFeeds.length,
      });
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Cleanup method (for module destruction)
   */
  /**
   * Get feed statistics
   */
  async getFeedStats(): Promise<ThreatFeedStats> {
    const stats: ThreatFeedStats = {};

    for (const feed of this.config.feeds) {
      const feedKey = `${this.config.cachePrefix || 'threat:feed'}:${feed.name}`;

      try {
        const ipCount = this.redis ? await this.redis.scard(feedKey) : 0;
        const ttl = this.redis ? await this.redis.ttl(feedKey) : -1;
        const lastUpdated =
          ttl > 0
            ? new Date(Date.now() - (this.config.cacheTTL - ttl) * 1000)
            : null;

        stats[feed.name] = {
          ipCount,
          lastUpdated,
          enabled: feed.enabled,
        };
      } catch (error: unknown) {
        this.logger.warn('Error getting feed stats', {
          feed: feed.name,
          error: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        });
        stats[feed.name] = {
          ipCount: 0,
          lastUpdated: null,
          enabled: feed.enabled,
        };
      }
    }

    return stats;
  }
  onModuleDestroy(): void {
    this.ipSets.clear();
    this.logger.log('Threat Feed Service destroyed');
  }
}
