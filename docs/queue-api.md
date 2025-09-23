# WellFlow Queue System API Documentation

## Overview

The WellFlow Queue System API provides comprehensive endpoints for managing
background job processing, monitoring queue health, and scheduling recurring
tasks. All endpoints require proper authentication and follow RESTful
conventions.

## Base URL

```
Development: http://localhost:3001/api/jobs
Production: https://api.wellflow.com/api/jobs
```

## Authentication

All API endpoints require JWT authentication via the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

### Required Roles

- **ADMIN**: Full access to all queue operations
- **OPERATOR**: Queue monitoring and basic job management
- **MANAGER**: Queue oversight and reporting access

## Job Queue Management

### List All Queues

Get information about all available job queues.

```http
GET /api/jobs/queues
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "data-validation",
      "waiting": 5,
      "active": 2,
      "completed": 1250,
      "failed": 12,
      "delayed": 8,
      "paused": false
    },
    {
      "name": "report-generation",
      "waiting": 3,
      "active": 1,
      "completed": 890,
      "failed": 5,
      "delayed": 2,
      "paused": false
    },
    {
      "name": "email-notifications",
      "waiting": 12,
      "active": 5,
      "completed": 2340,
      "failed": 8,
      "delayed": 15,
      "paused": false
    }
  ]
}
```

### Get Queue Details

Get detailed information about a specific queue.

```http
GET /api/jobs/queues/{queueName}
```

**Parameters:**

- `queueName` (string): Name of the queue (data-validation, report-generation,
  email-notifications)

**Response:**

```json
{
  "success": true,
  "data": {
    "name": "data-validation",
    "waiting": 5,
    "active": 2,
    "completed": 1250,
    "failed": 12,
    "delayed": 8,
    "paused": false,
    "opts": {
      "maxConcurrency": 10,
      "stalledInterval": 30000,
      "maxStalledCount": 1
    }
  }
}
```

### Get Jobs in Queue

Retrieve jobs from a specific queue with optional filtering.

```http
GET /api/jobs/queues/{queueName}/jobs
```

**Query Parameters:**

- `status` (string): Filter by job status (waiting, active, completed, failed,
  delayed)
- `limit` (number): Maximum number of jobs to return (default: 20, max: 100)
- `offset` (number): Number of jobs to skip (default: 0)
- `order` (string): Sort order (asc, desc) (default: desc)

**Response:**

```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "123",
        "name": "validate-well-data",
        "data": {
          "wellId": "WELL-1250",
          "leaseId": "LEASE-211",
          "validationType": "production_data"
        },
        "opts": {
          "attempts": 3,
          "delay": 0,
          "priority": 0
        },
        "progress": 0,
        "delay": 0,
        "timestamp": 1640995200000,
        "attemptsMade": 0,
        "stacktrace": [],
        "returnvalue": null,
        "finishedOn": null,
        "processedOn": null
      }
    ],
    "total": 1,
    "hasMore": false
  }
}
```

### Add Job to Queue

Add a new job to a specific queue.

```http
POST /api/jobs/queues/{queueName}/jobs
```

**Request Body:**

```json
{
  "name": "validate-well-data",
  "data": {
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
  },
  "opts": {
    "priority": 1,
    "delay": 0,
    "attempts": 3
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "jobId": "456",
    "message": "Job added successfully"
  }
}
```

### Remove Job

Remove a specific job from a queue.

```http
DELETE /api/jobs/queues/{queueName}/jobs/{jobId}
```

**Response:**

```json
{
  "success": true,
  "message": "Job removed successfully"
}
```

### Retry Failed Job

Retry a failed job.

```http
POST /api/jobs/queues/{queueName}/jobs/{jobId}/retry
```

**Response:**

```json
{
  "success": true,
  "message": "Job queued for retry"
}
```

## Job Scheduling

### List Scheduled Jobs

Get all scheduled/recurring jobs.

```http
GET /api/jobs/schedules
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "name": "daily-production-validation",
      "cron": "0 2 * * *",
      "enabled": true,
      "timezone": "America/Chicago",
      "description": "Daily validation of production data for compliance",
      "nextRun": "2024-01-02T08:00:00.000Z",
      "lastRun": "2024-01-01T08:00:00.000Z"
    }
  ]
}
```

### Create Scheduled Job

Create a new recurring job schedule.

```http
POST /api/jobs/schedules
```

**Request Body:**

```json
{
  "name": "weekly-compliance-report",
  "cron": "0 6 * * 0",
  "enabled": true,
  "timezone": "America/Chicago",
  "description": "Weekly compliance report generation",
  "jobData": {
    "organizationId": "system",
    "reportType": "compliance_weekly",
    "includeCharts": true,
    "format": "pdf",
    "recipients": ["compliance@wellflow.com"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "name": "weekly-compliance-report",
    "message": "Scheduled job created successfully"
  }
}
```

### Update Scheduled Job

Update an existing scheduled job.

```http
PUT /api/jobs/schedules/{scheduleName}
```

**Request Body:**

```json
{
  "cron": "0 7 * * 0",
  "enabled": false,
  "description": "Updated weekly compliance report"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Scheduled job updated successfully"
}
```

### Delete Scheduled Job

Remove a scheduled job.

```http
DELETE /api/jobs/schedules/{scheduleName}
```

**Response:**

```json
{
  "success": true,
  "message": "Scheduled job deleted successfully"
}
```

## Monitoring & Health

### System Health Check

Check the overall health of the job system.

```http
GET /api/jobs/health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "redis": {
      "status": "connected",
      "latency": 2
    },
    "queues": {
      "data-validation": "healthy",
      "report-generation": "healthy",
      "email-notifications": "healthy"
    },
    "workers": {
      "active": 8,
      "total": 10
    }
  }
}
```

### Queue Metrics

Get detailed metrics for queue performance.

```http
GET /api/jobs/metrics
```

**Query Parameters:**

- `queue` (string): Specific queue name (optional)
- `timeframe` (string): Time period (1h, 24h, 7d, 30d) (default: 24h)

**Response:**

```json
{
  "success": true,
  "data": {
    "timeframe": "24h",
    "metrics": {
      "data-validation": {
        "processed": 1250,
        "failed": 12,
        "avgProcessingTime": 2.5,
        "throughput": 52.08,
        "errorRate": 0.96
      },
      "report-generation": {
        "processed": 890,
        "failed": 5,
        "avgProcessingTime": 15.2,
        "throughput": 37.08,
        "errorRate": 0.56
      },
      "email-notifications": {
        "processed": 2340,
        "failed": 8,
        "avgProcessingTime": 1.1,
        "throughput": 97.5,
        "errorRate": 0.34
      }
    }
  }
}
```

### Performance Statistics

Get system performance statistics.

```http
GET /api/jobs/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uptime": 86400,
    "totalJobs": 4480,
    "completedJobs": 4267,
    "failedJobs": 25,
    "activeJobs": 8,
    "waitingJobs": 20,
    "delayedJobs": 25,
    "memoryUsage": {
      "used": 256,
      "total": 1024,
      "percentage": 25
    },
    "cpuUsage": 15.5
  }
}
```

## Bulk Operations

### Bulk Job Creation

Create multiple jobs in a single request.

```http
POST /api/jobs/bulk
```

**Request Body:**

```json
{
  "jobs": [
    {
      "queue": "data-validation",
      "name": "validate-well-data-1",
      "data": {
        /* job data */
      }
    },
    {
      "queue": "email-notifications",
      "name": "send-alert-1",
      "data": {
        /* job data */
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "created": 2,
    "failed": 0,
    "jobIds": ["789", "790"]
  }
}
```

### Bulk Job Status

Get status of multiple jobs.

```http
POST /api/jobs/status
```

**Request Body:**

```json
{
  "jobIds": ["123", "456", "789"]
}
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "jobId": "123",
      "status": "completed",
      "progress": 100,
      "result": {
        /* job result */
      }
    },
    {
      "jobId": "456",
      "status": "failed",
      "progress": 0,
      "error": "Validation failed"
    },
    {
      "jobId": "789",
      "status": "active",
      "progress": 75,
      "result": null
    }
  ]
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid job data provided",
    "details": {
      "field": "wellId",
      "reason": "Required field missing"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_ERROR` - Invalid or missing JWT token
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `VALIDATION_ERROR` - Invalid request data
- `QUEUE_NOT_FOUND` - Specified queue does not exist
- `JOB_NOT_FOUND` - Specified job does not exist
- `SYSTEM_ERROR` - Internal system error
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Standard endpoints**: 100 requests per minute
- **Bulk operations**: 10 requests per minute
- **Health checks**: 300 requests per minute

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995260
```

## Webhooks

Configure webhooks to receive notifications about job events.

### Webhook Events

- `job.completed` - Job completed successfully
- `job.failed` - Job failed after all retries
- `job.stalled` - Job became stalled
- `queue.paused` - Queue was paused
- `queue.resumed` - Queue was resumed

### Webhook Payload

```json
{
  "event": "job.completed",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "jobId": "123",
    "queue": "data-validation",
    "name": "validate-well-data",
    "result": {
      /* job result */
    }
  }
}
```

## SDK Examples

### Node.js

```javascript
const WellFlowAPI = require('@wellflow/api-client');

const client = new WellFlowAPI({
  baseURL: 'https://api.wellflow.com',
  token: 'your-jwt-token',
});

// Add a job
const job = await client.jobs.add('data-validation', {
  name: 'validate-well-data',
  data: {
    wellId: 'WELL-123',
    validationType: 'production_data',
  },
});

// Get queue status
const status = await client.jobs.getQueue('data-validation');
```

### Python

```python
from wellflow_api import WellFlowClient

client = WellFlowClient(
    base_url='https://api.wellflow.com',
    token='your-jwt-token'
)

# Add a job
job = client.jobs.add('data-validation', {
    'name': 'validate-well-data',
    'data': {
        'wellId': 'WELL-123',
        'validationType': 'production_data'
    }
})

# Get metrics
metrics = client.jobs.get_metrics(timeframe='24h')
```

This API documentation provides comprehensive coverage of all available
endpoints for managing the WellFlow queue system.
