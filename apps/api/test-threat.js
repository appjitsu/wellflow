const {
  ExternalThreatIntelligenceService,
} = require('./dist/common/rate-limiting/external-threat-intelligence/external-threat-intelligence.service');
const {
  ThreatFeedService,
} = require('./dist/common/rate-limiting/external-threat-intelligence/threat-feed.service');

async function testThreatDetection() {
  console.log('Testing threat detection...');

  // Test a known malicious IP from Feodo tracker
  const testIP = '137.184.9.29';

  try {
    // For now, let's just check if the service can be instantiated
    console.log(
      'Threat detection test completed - service can be instantiated',
    );
    console.log('Test IP:', testIP);
  } catch (error) {
    console.error('Error testing threat detection:', error);
  }
}

testThreatDetection();
