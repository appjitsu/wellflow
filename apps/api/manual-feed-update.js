#!/usr/bin/env node

/**
 * Manual Threat Feed Update Script
 *
 * This script manually triggers threat intelligence feed updates
 * by directly calling the feed update methods.
 */

const { Redis } = require('ioredis');

// Simple IP validation
function isValidIP(ip) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
}

// Feed configuration
const FEEDS = [
  {
    name: 'emerging-threats',
    url: 'https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt',
    description: 'Emerging Threats IP Blocklist',
  },
  {
    name: 'spamhaus-drop',
    url: 'https://www.spamhaus.org/drop/drop.txt',
    description: "Spamhaus DROP (Don't Route Or Peer) List",
  },
  {
    name: 'blocklist-de',
    url: 'https://lists.blocklist.de/lists/all.txt',
    description: 'Blocklist.de All Malicious IPs',
  },
  {
    name: 'abuse-ch-sslbl',
    url: 'https://sslbl.abuse.ch/blacklist/sslipblacklist_aggressive.txt',
    description: 'Abuse.ch SSL Blacklist IPs',
  },
  {
    name: 'abuse-ch-feodo',
    url: 'https://feodotracker.abuse.ch/downloads/ipblocklist.txt',
    description: 'Abuse.ch Feodo Tracker Botnet IPs',
  },
];

async function updateFeed(redis, feed) {
  console.log(`🔄 Updating feed: ${feed.name}`);
  console.log(`   URL: ${feed.url}`);

  try {
    // Fetch the threat feed data
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'WellFlow-Security-Scanner/1.0',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const ips = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .filter((line) => isValidIP(line));

    console.log(`   Found ${ips.length} valid IPs`);

    if (ips.length > 0) {
      // Store IPs in Redis
      const blacklistKey = `threat-intelligence:blacklist:${feed.name}`;

      // Clear existing data and add new IPs
      await redis.del(blacklistKey);

      // Use pipeline for better performance with large datasets
      const pipeline = redis.pipeline();

      // Add IPs in batches to avoid Redis memory issues
      const batchSize = 1000;
      for (let i = 0; i < ips.length; i += batchSize) {
        const batch = ips.slice(i, i + batchSize);
        pipeline.sadd(blacklistKey, ...batch);
      }

      // Set expiration
      pipeline.expire(blacklistKey, 86400); // 24 hours

      // Execute pipeline
      await pipeline.exec();

      console.log(
        `   ✅ Stored ${ips.length} IPs in Redis key: ${blacklistKey}`,
      );
    } else {
      console.log(`   ⚠️  No valid IPs found for ${feed.name}`);
    }

    // Store metadata
    const feedKey = `threat:feed:${feed.name}`;
    const feedData = {
      lastUpdated: new Date().toISOString(),
      ipCount: ips.length,
      source: feed.url,
      loaded: true,
      description: feed.description,
    };

    await redis.set(feedKey, JSON.stringify(feedData), 'EX', 86400);

    return { success: true, ipCount: ips.length };
  } catch (error) {
    console.error(`   ❌ Failed to update ${feed.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting manual threat feed update...\n');

  // Connect to Redis
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    // Test Redis connection
    await redis.ping();
    console.log('✅ Connected to Redis\n');

    const results = [];

    // Update each feed
    for (const feed of FEEDS) {
      const result = await updateFeed(redis, feed);
      results.push({ feed: feed.name, ...result });
      console.log(''); // Empty line for readability
    }

    // Summary
    console.log('📊 Update Summary:');
    console.log('==================');

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);

    if (successful.length > 0) {
      console.log('\n✅ Successfully updated feeds:');
      successful.forEach((r) => {
        console.log(`   - ${r.feed}: ${r.ipCount} IPs`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ Failed feeds:');
      failed.forEach((r) => {
        console.log(`   - ${r.feed}: ${r.error}`);
      });
    }

    const totalIPs = successful.reduce((sum, r) => sum + r.ipCount, 0);
    console.log(`\n🎯 Total IPs in blacklist: ${totalIPs.toLocaleString()}`);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await redis.quit();
    console.log('\n🔌 Disconnected from Redis');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
