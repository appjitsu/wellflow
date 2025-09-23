# WellFlow Queue System Documentation

## Overview

The WellFlow Queue System is a comprehensive background job processing
infrastructure built on BullMQ and Redis. It handles critical oil & gas industry
operations including data validation, report generation, and compliance
notifications.

## Architecture

### Core Components

1. **Job Queue Service** (`apps/api/src/jobs/services/job-queue.service.ts`)
   - Central job management and queue operations
   - Job creation, scheduling, and monitoring
   - Queue health checks and metrics

2. **Job Scheduler Service**
   (`apps/api/src/jobs/services/job-scheduler.service.ts`)
   - Cron-based recurring job scheduling
   - Timezone-aware scheduling (Central Time for oil & gas operations)
   - Default industry-specific schedules

3. **Job Processors** (`apps/api/src/jobs/processors/`)
   - Data validation processor
   - Report generation processor
   - Email notification processor

4. **Queue UI Dashboard** (`apps/queue-ui/`)
   - Bull Board web interface for monitoring
   - Real-time job status tracking
   - JWT-authenticated access

## Queue Types

### 1. Data Validation Queue (`data-validation`)

**Purpose**: Validates oil & gas production data for accuracy and compliance

**Job Types**:

- Production data validation
- Well data integrity checks
- Historical data verification
- Regulatory compliance validation

**Example Job Data**:

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
  "validationType": "production_data",
  "includeHistorical": false,
  "notifyOnFailure": true
}
```

### 2. Report Generation Queue (`report-generation`)

**Purpose**: Generates regulatory and operational reports

**Report Types**:

- `production_daily` - Daily production summaries
- `production_monthly` - Monthly production reports
- `compliance_monthly` - Monthly compliance reports
- `environmental_quarterly` - Quarterly environmental reports
- `safety_weekly` - Weekly safety reports

**Supported Formats**: PDF, Excel, CSV

**Example Job Data**:

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
  "recipients": [
    "manager@wellflow.com",
    "compliance@wellflow.com",
    "operations@wellflow.com"
  ],
  "priority": "high"
}
```

### 3. Email Notifications Queue (`email-notifications`)

**Purpose**: Sends critical alerts and notifications

**Notification Types**:

- `alert` - Immediate operational alerts
- `compliance_due` - Compliance deadline reminders
- `maintenance_required` - Equipment maintenance alerts
- `report_ready` - Report completion notifications
- `reminder` - General reminders

**Priority Levels**: urgent, high, medium, low

**Example Job Data**:

```json
{
  "notificationId": "NOTIF-1758639909793-40",
  "type": "report_ready",
  "message": "Safety inspection overdue",
  "recipients": ["safety@wellflow.com", "field@wellflow.com"],
  "priority": "urgent",
  "wellId": "WELL-5012",
  "organizationId": "ORG-4"
}
```

## Scheduled Jobs

The system includes default scheduled jobs for regular operations:

### Daily Jobs

- **Production Data Validation** (2:00 AM CT)
  - Validates previous day's production data
  - Ensures compliance with regulatory requirements

- **Permit Expiration Check** (9:00 AM CT)
  - Checks for expiring permits
  - Sends renewal reminders

### Weekly Jobs

- **Compliance Report Generation** (Sunday 6:00 AM CT)
  - Generates weekly compliance reports
  - Prepares for regulatory submission

### Monthly Jobs

- **Production Summary Report** (1st of month, 8:00 AM CT)
  - Comprehensive monthly production analysis
  - Stakeholder distribution

## Configuration

### Environment Variables

**API Service** (`.env`):

```env
REDIS_URL=redis://localhost:6379
BULLMQ_DEFAULT_JOB_OPTIONS_DELAY=0
BULLMQ_DEFAULT_JOB_OPTIONS_ATTEMPTS=3
BULLMQ_DEFAULT_JOB_OPTIONS_BACKOFF_TYPE=exponential
BULLMQ_DEFAULT_JOB_OPTIONS_BACKOFF_DELAY=2000
```

**Queue UI** (`apps/queue-ui/.env`):

```env
PORT=3003
REDIS_URL=redis://localhost:6379
JWT_SECRET=wellflow-dev-secret
NODE_ENV=development
```

### Queue Configuration

```typescript
// Default queue options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};
```

## Monitoring & Management

### Queue UI Dashboard

**Access**: `http://localhost:3003/?token=<JWT_TOKEN>`

**Features**:

- Real-time job monitoring
- Queue status overview
- Individual job inspection
- Job retry and management
- Performance metrics

**Authentication**:

- JWT-based security
- Role-based access (ADMIN, OPERATOR, MANAGER)
- Token generation: `node apps/queue-ui/generate-test-token.js`

### Job States

- **ACTIVE** - Currently processing
- **WAITING** - Queued for processing
- **WAITING CHILDREN** - Waiting for child jobs
- **PRIORITIZED** - High priority jobs
- **COMPLETED** - Successfully finished
- **FAILED** - Processing failed
- **DELAYED** - Scheduled for future execution
- **PAUSED** - Queue temporarily paused

## Development & Testing

### Test Job Generation

Generate realistic test jobs for development:

```bash
cd apps/queue-ui
node generate-test-jobs.js
```

This creates 39 test jobs across all queues with realistic oil & gas industry
data.

### Running the Queue UI

```bash
cd apps/queue-ui
pnpm install
pnpm run dev
```

### API Integration

The queue system integrates with the main API through the Jobs module:

```typescript
// apps/api/src/jobs/jobs.module.ts
@Module({
  imports: [BullModule.forRoot(/* config */)],
  providers: [
    JobQueueService,
    JobSchedulerService,
    JobMetricsService,
    // ... processors
  ],
  controllers: [
    JobMonitoringController,
    JobSchedulerController,
    JobMetricsController,
  ],
  exports: [JobQueueService, JobSchedulerService],
})
export class JobsModule {}
```

## Error Handling & Resilience

### Retry Strategy

- **Default Attempts**: 3 retries
- **Backoff**: Exponential with 2-second base delay
- **Dead Letter Queue**: Failed jobs retained for analysis

### Circuit Breaker Pattern

- Automatic failure detection
- Service degradation handling
- Recovery monitoring

### Monitoring & Alerts

- Job failure notifications
- Queue health monitoring
- Performance metrics tracking
- Redis connection monitoring

## Security

### Authentication

- JWT-based API authentication
- Role-based access control
- Secure token generation and validation

### Data Protection

- Sensitive data sanitization
- Audit trail logging
- Compliance with industry regulations

### Network Security

- Redis connection security
- CORS configuration
- Content Security Policy (CSP)

## Performance Optimization

### Queue Management

- Job deduplication
- Automatic cleanup of completed jobs
- Memory-efficient job storage

### Scaling Considerations

- Horizontal scaling support
- Load balancing across workers
- Redis cluster compatibility

## Troubleshooting

### Common Issues

1. **Redis Connection Errors**
   - Check Redis server status
   - Verify connection string
   - Monitor network connectivity

2. **Job Processing Failures**
   - Review job logs in Bull Board
   - Check processor error handling
   - Verify job data format

3. **Authentication Issues**
   - Validate JWT token
   - Check role permissions
   - Verify secret configuration

### Debugging Tools

- Bull Board dashboard for job inspection
- API endpoints for queue metrics
- Comprehensive logging throughout the system
- Health check endpoints

## API Endpoints

### Job Management

- `GET /api/jobs/queues` - List all queues
- `GET /api/jobs/queues/:name/jobs` - Get jobs in queue
- `POST /api/jobs/queues/:name/jobs` - Add job to queue
- `DELETE /api/jobs/queues/:name/jobs/:id` - Remove job

### Monitoring

- `GET /api/jobs/health` - System health check
- `GET /api/jobs/metrics` - Queue metrics
- `GET /api/jobs/stats` - Performance statistics

### Scheduling

- `GET /api/jobs/schedules` - List scheduled jobs
- `POST /api/jobs/schedules` - Create scheduled job
- `PUT /api/jobs/schedules/:name` - Update schedule
- `DELETE /api/jobs/schedules/:name` - Remove schedule

## Best Practices

### Job Design

- Keep jobs idempotent
- Use appropriate job priorities
- Include comprehensive error handling
- Log important job events

### Queue Management

- Monitor queue sizes regularly
- Set appropriate retry limits
- Clean up old jobs periodically
- Use job deduplication when needed

### Performance

- Batch similar operations
- Use appropriate concurrency limits
- Monitor memory usage
- Optimize job data size

### Security

- Validate all job inputs
- Sanitize sensitive data
- Use secure authentication
- Audit job execution

This documentation provides a comprehensive overview of the WellFlow Queue
System. For specific implementation details, refer to the source code and inline
documentation.
