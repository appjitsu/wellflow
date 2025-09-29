// Simple test script to verify threat detection is working
const Redis = require('ioredis');
const {
  ThreatFeedService,
} = require('./dist/common/rate-limiting/external-threat-intelligence/threat-feed.service');

async function testThreatDetection() {
  console.log('Testing threat detection...');

  const redis = new Redis('redis://localhost:6380');

  try {
    // Create a simple threat feed service instance
    const threatFeedService = new ThreatFeedService(redis);

    // Test with a known malicious IP from Feodo tracker
    const testIP = '137.184.9.29';

    console.log(`Testing IP: ${testIP}`);

    // Check if IP is in threat feeds
    const isThreat = threatFeedService.isIPInThreatFeeds(testIP);
    console.log(`Is threat: ${isThreat}`);

    // Get threat feed info
    const info = threatFeedService.getThreatFeedInfo(testIP);
    console.log('Threat feed info:', info);

    // Get feed status
    const status = threatFeedService.getFeedStatus();
    console.log('Feed status:', status);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await redis.quit();
  }
}

testThreatDetection();
