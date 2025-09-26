import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Load environment variables
config();

/**
 * WellFlow Queue Monitoring Dashboard
 *
 * Standalone Express application for monitoring BullMQ job queues.
 * Designed for Railway deployment as a separate service.
 *
 * Features:
 * - Bull-Board UI for queue monitoring
 * - JWT authentication
 * - CORS and security headers
 * - Health check endpoint
 */

const app = express();
const PORT = process.env.PORT || 3002;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  })
);

app.use(express.json());

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Initialize Redis connection
const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

redis.on('connect', () => {
  logger.info('✅ Queue UI Redis connected successfully');
});

redis.on('error', (err: Error) => {
  logger.error('❌ Queue UI Redis connection error:', { message: err.message, stack: err.stack });
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
    service: 'queue-ui',
    version: process.env.npm_package_version || '0.0.1',
    redis: redis.status,
    queues: queueNames,
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    service: 'WellFlow Queue Monitoring Dashboard',
    version: process.env.npm_package_version || '0.0.1',
    description: 'BullMQ queue monitoring for oil & gas production management',
    queues: queueNames.map((name) => ({
      name,
      url: `/${name}`,
    })),
    endpoints: {
      health: '/health',
      dashboard: '/',
      api: '/api/info',
    },
  });
});

// Authentication middleware for dashboard access
app.use('/', authMiddleware as express.RequestHandler);

// Mount Bull-Board
app.use('/', serverAdapter.getRouter());

// Error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Wait for Redis to be ready (ioredis connects automatically)
    await new Promise<void>((resolve, reject) => {
      if (redis.status === 'ready') {
        resolve();
      } else {
        redis.once('ready', resolve);
        redis.once('error', reject);
      }
    });

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`🚀 Queue UI Dashboard running on port ${PORT}`);
      logger.info(`📊 Dashboard available at http://localhost:${PORT}`);
      logger.info(`🔍 Health check at http://localhost:${PORT}/health`);
      logger.info(`📡 API info at http://localhost:${PORT}/api/info`);
      logger.info(`🔗 Connected to Redis: ${REDIS_URL}`);
      logger.info(`🎯 Monitoring queues: ${queueNames.join(', ')}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start Queue UI Dashboard:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🔄 Shutting down Queue UI Dashboard...');

  // Close Redis connection
  await redis.quit();

  // Close queues
  await Promise.all(queues.map((queue) => queue.close()));

  logger.info('✅ Queue UI Dashboard shut down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🔄 Shutting down Queue UI Dashboard...');

  // Close Redis connection
  await redis.quit();

  // Close queues
  await Promise.all(queues.map((queue) => queue.close()));

  logger.info('✅ Queue UI Dashboard shut down gracefully');
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
});
