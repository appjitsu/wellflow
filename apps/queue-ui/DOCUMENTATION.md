# WellFlow Queue UI Documentation

## Overview

The WellFlow Queue UI is a web-based dashboard for monitoring and managing
BullMQ job queues in the WellFlow oil & gas production management system. Built
with Bull Board, it provides real-time visibility into background job
processing.

## Features

- **Real-time Queue Monitoring** - Live updates of job statuses across all
  queues
- **Individual Job Inspection** - Detailed view of job data, options, logs, and
  errors
- **Status Filtering** - Filter jobs by ACTIVE, WAITING, COMPLETED, FAILED, etc.
- **JWT Authentication** - Secure access with role-based permissions
- **Industry-Specific Data** - Tailored for oil & gas operations and compliance

## Quick Start

### Prerequisites

- Node.js 18+
- Redis server running on localhost:6379
- WellFlow API service running (for authentication)

### Installation & Setup

```bash
cd apps/queue-ui
pnpm install
```

### Environment Configuration

Create `.env` file:

```env
PORT=3003
REDIS_URL=redis://localhost:6379
JWT_SECRET=wellflow-dev-secret
NODE_ENV=development
```

### Running the Application

```bash
# Development mode with auto-reload
pnpm run dev

# Production mode
pnpm run build
pnpm start
```

The dashboard will be available at `http://localhost:3003`

## Authentication

### JWT Token Requirements

The Queue UI requires a valid JWT token with the following claims:

```json
{
  "id": "user-id",
  "sub": "user-id",
  "email": "user@wellflow.com",
  "roles": ["ADMIN", "OPERATOR", "MANAGER"],
  "organizationId": "org-id",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Generating Test Tokens

Use the included token generator for development:

```bash
node generate-test-token.js
```

This creates a 24-hour token with ADMIN and OPERATOR roles.

### Accessing the Dashboard

Add the token as a URL parameter:

```
http://localhost:3003/?token=<your-jwt-token>
```

## Queue Monitoring

### Supported Queues

The dashboard monitors three primary queues:

1. **data-validation** - Production data validation jobs
2. **report-generation** - Regulatory and operational reports
3. **email-notifications** - Critical alerts and notifications

### Job States

- **ACTIVE** - Currently being processed
- **WAITING** - Queued for processing
- **WAITING CHILDREN** - Waiting for dependent jobs
- **PRIORITIZED** - High-priority jobs
- **COMPLETED** - Successfully finished
- **FAILED** - Processing failed with errors
- **DELAYED** - Scheduled for future execution
- **PAUSED** - Queue temporarily paused

### Dashboard Views

#### Main Dashboard

- Overview of all queues with job counts
- Visual progress bars showing job distribution
- Quick navigation to individual queues

#### Individual Queue View

- Detailed job listings with timestamps
- Job data inspection with JSON formatting
- Interactive tabs for Data, Options, Logs, and Errors
- Status filtering and search capabilities

#### Job Detail View

- Complete job payload in formatted JSON
- Processing logs and error details
- Job options and configuration
- Retry and management actions

## Testing & Development

### Generating Test Jobs

Create realistic test data for development:

```bash
node generate-test-jobs.js
```

This script creates 39 jobs across all queues with realistic oil & gas industry
data:

- **14 Data Validation Jobs** - Well production data, geographic locations,
  validation types
- **15 Email Notification Jobs** - Safety alerts, compliance reminders,
  operational notifications
- **10 Report Generation Jobs** - Environmental, production, compliance, and
  safety reports

### Test Job Types

#### Data Validation Jobs

```json
{
  "wellId": "WELL-1250",
  "leaseId": "LEASE-211",
  "operatorId": "OP-9",
  "location": {
    "latitude": 32.164755413290436,
    "longitude": -97.86549451222577,
    "county": "Howard",
    "state": "TX"
  },
  "production": {
    "oil": 518,
    "gas": 1854,
    "water": 21
  },
  "validationType": "production_data"
}
```

#### Email Notification Jobs

```json
{
  "notificationId": "NOTIF-1758639909793-40",
  "type": "report_ready",
  "message": "Safety inspection overdue",
  "recipients": ["safety@wellflow.com", "field@wellflow.com"],
  "priority": "urgent",
  "wellId": "WELL-5012"
}
```

#### Report Generation Jobs

```json
{
  "reportId": "RPT-1758639909790-272",
  "reportType": "environmental_quarterly",
  "organizationId": "ORG-8",
  "dateRange": {
    "start": "2025-09-05T22:42:36.494Z",
    "end": "2025-09-23T15:05:09.790Z"
  },
  "format": "pdf",
  "includeCharts": true,
  "recipients": ["manager@wellflow.com", "compliance@wellflow.com"]
}
```

## Configuration

### Server Configuration

The Express server is configured with:

- **CORS** - Cross-origin resource sharing for API access
- **Helmet** - Security headers and CSP configuration
- **JWT Middleware** - Authentication for protected routes
- **Static Assets** - Bull Board UI assets and resources

### Security Configuration

#### Content Security Policy

```javascript
{
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}
```

#### Authentication Middleware

- Validates JWT tokens on all dashboard routes
- Excludes static assets and health endpoints
- Supports role-based access control
- Comprehensive audit logging

### Redis Configuration

```javascript
const redisConfig = {
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};
```

## API Endpoints

### Health & Status

- `GET /health` - Application health check
- `GET /api/info` - API information and version

### Bull Board Routes

- `GET /` - Main dashboard (requires authentication)
- `GET /queue/:queueName` - Individual queue view
- `GET /api/queues` - Queue API endpoints (Bull Board)

## Architecture

### File Structure

```
apps/queue-ui/
├── src/
│   ├── index.ts              # Main server application
│   ├── middleware/
│   │   └── auth.middleware.ts # JWT authentication
│   └── utils/
│       └── logger.ts         # Logging utilities
├── generate-test-jobs.js     # Test data generator
├── generate-test-token.js    # JWT token generator
├── .env                      # Environment configuration
├── .env.example             # Environment template
├── package.json             # Dependencies and scripts
├── Dockerfile               # Container configuration
└── README.md               # Basic setup instructions
```

### Dependencies

#### Core Dependencies

- **@bull-board/express** - Bull Board Express adapter
- **@bull-board/ui** - Bull Board web interface
- **bullmq** - Job queue management
- **express** - Web server framework
- **ioredis** - Redis client
- **jsonwebtoken** - JWT authentication

#### Security & Middleware

- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **dotenv** - Environment configuration

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3003
CMD ["npm", "start"]
```

### Environment Variables

Production environment variables:

```env
PORT=3003
REDIS_URL=redis://redis-server:6379
JWT_SECRET=your-production-secret
NODE_ENV=production
```

### Health Checks

The application provides health check endpoints for monitoring:

```bash
# Application health
curl http://localhost:3003/health

# API information
curl http://localhost:3003/api/info
```

## Troubleshooting

### Common Issues

#### Redis Connection Errors

```
Error: Redis connection failed
```

**Solution**: Verify Redis server is running and accessible at the configured
URL.

#### Authentication Failures

```
Error: Invalid or expired token
```

**Solution**: Generate a new JWT token or verify the JWT_SECRET matches the API
service.

#### Port Conflicts

```
Error: Port 3003 already in use
```

**Solution**: Change the PORT environment variable or stop conflicting services.

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
DEBUG=queue-ui:*
```

### Log Analysis

The application logs include:

- Authentication attempts and failures
- Queue connection status
- Job processing events
- Error details and stack traces

## Performance Considerations

### Memory Usage

- Bull Board caches job data for performance
- Large job payloads may impact memory usage
- Consider job data size limits for optimal performance

### Network Optimization

- Static assets are served with appropriate caching headers
- Gzip compression enabled for text resources
- CDN integration recommended for production

### Scaling

- Multiple instances can share the same Redis backend
- Load balancing supported with session affinity
- Horizontal scaling recommended for high-traffic environments

## Security Best Practices

### Authentication

- Use strong JWT secrets in production
- Implement token rotation policies
- Monitor authentication failures

### Network Security

- Use HTTPS in production environments
- Implement proper firewall rules
- Restrict Redis access to authorized services

### Data Protection

- Sanitize sensitive data in job payloads
- Implement audit logging for compliance
- Regular security updates and patches

## Integration with WellFlow API

The Queue UI integrates seamlessly with the main WellFlow API:

- **Shared JWT Secret** - Uses same authentication system
- **Role-Based Access** - Respects API user roles and permissions
- **Audit Integration** - Logs queue activities for compliance
- **Health Monitoring** - Participates in overall system health checks

For complete system integration, ensure both services share the same:

- JWT_SECRET configuration
- Redis connection settings
- User role definitions
- Audit logging standards

This documentation provides comprehensive guidance for using and maintaining the
WellFlow Queue UI dashboard.
