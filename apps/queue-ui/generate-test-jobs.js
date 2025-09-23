#!/usr/bin/env node

/**
 * Generate Test Jobs for Queue UI Testing
 *
 * This script creates various types of jobs in all three queues to test
 * the Bull Board UI with realistic oil & gas industry job scenarios.
 */

const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const redis = new Redis('redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Queue names
const QUEUE_NAMES = {
  DATA_VALIDATION: 'data-validation',
  REPORT_GENERATION: 'report-generation',
  EMAIL_NOTIFICATIONS: 'email-notifications',
};

// Initialize queues
const queues = {
  [QUEUE_NAMES.DATA_VALIDATION]: new Queue(QUEUE_NAMES.DATA_VALIDATION, { connection: redis }),
  [QUEUE_NAMES.REPORT_GENERATION]: new Queue(QUEUE_NAMES.REPORT_GENERATION, { connection: redis }),
  [QUEUE_NAMES.EMAIL_NOTIFICATIONS]: new Queue(QUEUE_NAMES.EMAIL_NOTIFICATIONS, {
    connection: redis,
  }),
};

// Test data generators
// Note: Math.random() is acceptable here as this is for generating test data, not security purposes
const generateWellData = () => ({
  wellId: `WELL-${Math.floor(Math.random() * 10000)}`,
  leaseId: `LEASE-${Math.floor(Math.random() * 1000)}`,
  operatorId: `OP-${Math.floor(Math.random() * 100)}`,
  location: {
    latitude: 32.0 + Math.random() * 4, // Texas/Oklahoma range
    longitude: -102.0 + Math.random() * 6,
    county: ['Midland', 'Ector', 'Martin', 'Howard', 'Andrews'][Math.floor(Math.random() * 5)],
    state: 'TX',
  },
  production: {
    oil: Math.floor(Math.random() * 500) + 50, // barrels per day
    gas: Math.floor(Math.random() * 2000) + 200, // MCF per day
    water: Math.floor(Math.random() * 300) + 20, // barrels per day
  },
  timestamp: new Date(),
});

const generateReportData = () => ({
  reportId: `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  reportType: [
    'production_daily',
    'compliance_monthly',
    'environmental_quarterly',
    'safety_weekly',
  ][Math.floor(Math.random() * 4)],
  organizationId: `ORG-${Math.floor(Math.random() * 10)}`,
  dateRange: {
    start: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
  format: ['pdf', 'excel', 'csv'][Math.floor(Math.random() * 3)],
  includeCharts: Math.random() > 0.5,
  recipients: ['manager@wellflow.com', 'compliance@wellflow.com', 'operations@wellflow.com'],
  priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
});

const generateNotificationData = () => ({
  notificationId: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  type: ['alert', 'reminder', 'report_ready', 'compliance_due', 'maintenance_required'][
    Math.floor(Math.random() * 5)
  ],
  message: [
    'Well production below threshold',
    'Permit renewal required in 30 days',
    'Monthly report generation completed',
    'Environmental compliance check due',
    'Equipment maintenance scheduled',
    'Safety inspection overdue',
    'Gas flaring limits exceeded',
    'Water disposal permit expiring',
  ][Math.floor(Math.random() * 8)],
  recipients: [
    ['operator@wellflow.com'],
    ['compliance@wellflow.com', 'legal@wellflow.com'],
    ['manager@wellflow.com', 'operations@wellflow.com'],
    ['safety@wellflow.com', 'field@wellflow.com'],
  ][Math.floor(Math.random() * 4)],
  priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
  wellId: `WELL-${Math.floor(Math.random() * 10000)}`,
  organizationId: `ORG-${Math.floor(Math.random() * 10)}`,
});

// Job creation functions
async function createDataValidationJobs(count = 10) {
  console.log(`🔍 Creating ${count} data validation jobs...`);

  for (let i = 0; i < count; i++) {
    const wellData = generateWellData();
    const jobName = `validate-well-data-${i + 1}`;

    const jobOptions = {
      delay: Math.random() * 5000, // Random delay up to 5 seconds
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 50,
      removeOnFail: 20,
    };

    // Add some jobs with different priorities
    if (i % 3 === 0) {
      jobOptions.priority = 10; // High priority
    } else if (i % 3 === 1) {
      jobOptions.priority = 5; // Medium priority
    } else {
      jobOptions.priority = 1; // Low priority
    }

    await queues[QUEUE_NAMES.DATA_VALIDATION].add(
      jobName,
      {
        ...wellData,
        validationType: 'production_data',
        includeHistorical: Math.random() > 0.5,
        notifyOnFailure: Math.random() > 0.3,
      },
      jobOptions
    );
  }
}

async function createReportGenerationJobs(count = 8) {
  console.log(`📊 Creating ${count} report generation jobs...`);

  for (let i = 0; i < count; i++) {
    const reportData = generateReportData();
    const jobName = `generate-report-${i + 1}`;

    const jobOptions = {
      delay: Math.random() * 10000, // Random delay up to 10 seconds
      attempts: 2,
      removeOnComplete: 30,
      removeOnFail: 10,
    };

    // Some reports take longer to process
    if (reportData.reportType.includes('quarterly')) {
      jobOptions.delay += 15000; // Additional delay for complex reports
    }

    await queues[QUEUE_NAMES.REPORT_GENERATION].add(jobName, reportData, jobOptions);
  }
}

async function createEmailNotificationJobs(count = 15) {
  console.log(`📧 Creating ${count} email notification jobs...`);

  for (let i = 0; i < count; i++) {
    const notificationData = generateNotificationData();
    const jobName = `send-notification-${i + 1}`;

    const jobOptions = {
      delay: Math.random() * 3000, // Random delay up to 3 seconds
      attempts: 5, // Email notifications should retry more
      backoff: {
        type: 'fixed',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    };

    // Urgent notifications get processed immediately
    if (notificationData.priority === 'urgent') {
      jobOptions.delay = 0;
      jobOptions.priority = 20;
    } else if (notificationData.priority === 'high') {
      jobOptions.priority = 10;
    }

    await queues[QUEUE_NAMES.EMAIL_NOTIFICATIONS].add(jobName, notificationData, jobOptions);
  }
}

// Add some failed jobs for testing
async function createFailedJobs() {
  console.log('❌ Creating some failed jobs for testing...');

  // Add a job that will fail immediately
  await queues[QUEUE_NAMES.DATA_VALIDATION].add(
    'failing-validation-job',
    {
      wellId: 'INVALID-WELL',
      shouldFail: true,
      errorType: 'validation_error',
    },
    {
      attempts: 1,
      removeOnFail: false, // Keep failed jobs for testing
    }
  );

  await queues[QUEUE_NAMES.REPORT_GENERATION].add(
    'failing-report-job',
    {
      reportType: 'invalid_report_type',
      shouldFail: true,
      errorType: 'generation_error',
    },
    {
      attempts: 1,
      removeOnFail: false,
    }
  );
}

// Add some delayed jobs
async function createDelayedJobs() {
  console.log('⏰ Creating delayed jobs...');

  await queues[QUEUE_NAMES.DATA_VALIDATION].add(
    'delayed-validation',
    {
      wellId: 'WELL-DELAYED-001',
      validationType: 'scheduled_validation',
    },
    {
      delay: 30000, // 30 seconds delay
    }
  );

  await queues[QUEUE_NAMES.REPORT_GENERATION].add(
    'delayed-monthly-report',
    {
      reportType: 'production_monthly',
      scheduledFor: new Date(Date.now() + 60000),
    },
    {
      delay: 60000, // 1 minute delay
    }
  );
}

// Main execution
async function generateAllTestJobs() {
  try {
    console.log('🚀 Starting test job generation for WellFlow Queue UI...\n');

    await createDataValidationJobs(12);
    await createReportGenerationJobs(8);
    await createEmailNotificationJobs(15);
    await createFailedJobs();
    await createDelayedJobs();

    console.log('\n✅ Test job generation completed!');
    console.log('\n📊 Summary:');
    console.log('- Data Validation Jobs: 12 + 1 failed + 1 delayed = 14 total');
    console.log('- Report Generation Jobs: 8 + 1 failed + 1 delayed = 10 total');
    console.log('- Email Notification Jobs: 15 total');
    console.log('- Total Jobs Created: 39');

    console.log('\n🌐 View the jobs at: http://localhost:3003/?token=<your-jwt-token>');
    console.log('🔑 Generate a token with: node generate-test-token.js');
  } catch (error) {
    console.error('❌ Error generating test jobs:', error);
  } finally {
    // Close connections
    await Promise.all(Object.values(queues).map((queue) => queue.close()));
    await redis.quit();
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  generateAllTestJobs();
}

module.exports = {
  generateAllTestJobs,
  createDataValidationJobs,
  createReportGenerationJobs,
  createEmailNotificationJobs,
};
