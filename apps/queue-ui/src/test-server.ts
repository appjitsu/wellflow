import express from 'express';
import cors from 'cors';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

/**
 * Simple test server for BullMQ UI without authentication
 */

const app = express();
const PORT = process.env.PORT || 3002;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

app.use(cors());
app.use(express.json());

// Initialize Redis connection
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('connect', () => {
  console.log('✅ Queue UI Redis connected successfully');
});

redis.on('error', (err: Error) => {
  console.error('❌ Queue UI Redis connection error:', err);
});

// Initialize BullMQ queues
const queueNames = ['data-validation', 'report-generation', 'email-notifications'];
const queues = queueNames.map((name) => new Queue(name, { connection: redis }));

// Create Bull-Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/');

createBullBoard({
  queues: queues.map((queue) => new BullMQAdapter(queue)),
  serverAdapter,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'queue-ui-test',
    version: '0.0.1',
    redis: redis.status,
    queues: queueNames,
  });
});

// Mount Bull-Board without authentication
app.use('/', serverAdapter.getRouter());

// Start server
async function startServer() {
  try {
    // Connect to Redis
    await redis.connect();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Queue UI Test Server running on port ${PORT}`);
      console.log(`📊 Dashboard available at http://localhost:${PORT}`);
      console.log(`🔍 Health check at http://localhost:${PORT}/health`);
      console.log(`🔗 Connected to Redis: ${REDIS_URL}`);
      console.log(`🎯 Monitoring queues: ${queueNames.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Queue UI Test Server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down Queue UI Test Server...');

  // Close Redis connection
  await redis.quit();

  // Close queues
  await Promise.all(queues.map((queue) => queue.close()));

  console.log('✅ Queue UI Test Server shut down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Shutting down Queue UI Test Server...');

  // Close Redis connection
  await redis.quit();

  // Close queues
  await Promise.all(queues.map((queue) => queue.close()));

  console.log('✅ Queue UI Test Server shut down gracefully');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
