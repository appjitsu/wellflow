# WellFlow API Documentation

## Overview

The WellFlow API provides comprehensive functionality for oil & gas well management, production tracking, regulatory compliance, and operational monitoring. Built with NestJS and following Clean Architecture principles with Domain-Driven Design patterns.

## Base URL

```
https://api.wellflow.com/v1
```

## Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Error Handling

Error responses include detailed information:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Rate Limiting

- **Authenticated users**: 100 requests/minute
- **Anonymous users**: 10 requests/minute
- **Emergency bypass**: Available for critical operations

## API Endpoints

### Health & Monitoring

#### Get Health Status
```http
GET /health
```

Returns system health information including database connectivity, external services, and performance metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "services": {
      "database": "connected",
      "redis": "connected",
      "sentry": "active",
      "logrocket": "active"
    },
    "uptime": "7d 14h 32m",
    "version": "1.0.0"
  }
}
```

#### Get System Metrics
```http
GET /monitoring/metrics
```

Returns comprehensive system metrics including performance, database, cache, and business metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "uptime": 604800,
    "memory": {
      "rss": 134217728,
      "heapTotal": 67108864,
      "heapUsed": 33554432,
      "external": 16777216,
      "utilizationPercent": 50
    },
    "database": {
      "connectionCount": 15,
      "activeQueries": 3,
      "slowQueries": 0,
      "cacheHitRatio": 0.95
    },
    "api": {
      "totalRequests": 15420,
      "averageResponseTime": 45,
      "errorRate": 0.02
    }
  }
}
```

#### Get Database Performance Metrics
```http
GET /monitoring/metrics/database
```

Returns detailed database performance metrics and query statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "performance": {
      "averageQueryTime": 12.5,
      "slowQueriesCount": 0,
      "totalQueries": 15420,
      "cacheHitRatio": 0.95
    },
    "queryStats": {
      "SELECT": 12000,
      "INSERT": 2000,
      "UPDATE": 1200,
      "DELETE": 220
    }
  }
}
```

#### Get Slow Database Queries
```http
GET /monitoring/metrics/database/slow-queries?threshold=1000&hours=1
```

Returns database queries that exceeded the specified threshold.

**Parameters:**
- `threshold` (optional): Query execution time threshold in milliseconds (default: 1000)
- `hours` (optional): Time range in hours (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "threshold": 1000,
    "timeRange": "1 hours",
    "slowQueries": [
      {
        "queryId": "query_123456",
        "query": "SELECT * FROM wells WHERE organization_id = $1",
        "executionTime": 1250,
        "timestamp": "2024-01-01T11:45:00Z",
        "organizationId": "org_123",
        "userId": "user_456"
      }
    ]
  }
}
```

#### Get Circuit Breaker Metrics
```http
GET /monitoring/metrics/circuit-breakers
```

Returns circuit breaker status and metrics for resilience monitoring.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "circuitBreakers": [
      {
        "serviceName": "external-weather-api",
        "state": "CLOSED",
        "failureCount": 0,
        "totalRequests": 150,
        "totalFailures": 0,
        "totalSuccesses": 150,
        "successRate": 1.0
      }
    ]
  }
}
```

#### Get Event Processing Metrics
```http
GET /monitoring/metrics/events
```

Returns event processing metrics for domain events and CQRS operations.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "events": {
      "totalPublished": 1250,
      "totalProcessed": 1248,
      "totalFailed": 2,
      "eventsByType": {
        "WellStatusChanged": 450,
        "ProductionRecorded": 800
      },
      "averageProcessingTime": 15
    }
  }
}
```

### Alert Management

#### Get Active Alerts
```http
GET /monitoring/alerts
```

Returns all currently active alerts in the system.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "alerts": [
      {
        "id": "alert_123456",
        "type": "PERFORMANCE",
        "severity": "HIGH",
        "title": "High Error Rate Detected",
        "message": "API error rate has exceeded 5%",
        "timestamp": "2024-01-01T11:30:00Z",
        "metadata": {
          "errorRate": 0.08,
          "threshold": 0.05
        }
      }
    ]
  }
}
```

#### Get Alert History
```http
GET /monitoring/alerts/history?limit=50
```

Returns historical alert data with optional limit.

**Parameters:**
- `limit` (optional): Maximum number of alerts to return (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "alerts": [
      {
        "id": "alert_123456",
        "type": "PERFORMANCE",
        "severity": "HIGH",
        "title": "High Error Rate Detected",
        "message": "API error rate has exceeded 5%",
        "timestamp": "2024-01-01T11:30:00Z",
        "resolved": true,
        "resolvedAt": "2024-01-01T11:45:00Z"
      }
    ]
  }
}
```

#### Resolve Alert
```http
POST /monitoring/alerts/{alertId}/resolve
```

Resolves a specific alert by ID.

**Parameters:**
- `alertId`: The unique identifier of the alert to resolve

**Response:**
```json
{
  "success": true,
  "message": "Alert alert_123456 resolved successfully"
}
```

#### Create Test Alert
```http
POST /monitoring/alerts/test
```

Creates a test alert to verify the alerting system is working.

**Request Body:**
```json
{
  "message": "This is a test alert",
  "severity": "LOW"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test alert created successfully",
  "alertId": "alert_123456"
}
```

### Circuit Breaker Management

#### Get Circuit Breaker Metrics
```http
GET /monitoring/metrics/circuit-breakers
```

Returns circuit breaker status and metrics.

#### Reset Circuit Breaker
```http
POST /monitoring/circuit-breakers/reset
```

Resets a circuit breaker to allow requests to pass through again.

**Request Body:**
```json
{
  "serviceName": "external-weather-api"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Circuit breaker for external-weather-api reset successfully"
}
```

### Database Locks
```http
GET /monitoring/metrics/database/locks
```

Returns information about current database locks and blocking queries.

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-01T12:00:00Z",
    "locks": [
      {
        "pid": 12345,
        "state": "active",
        "query": "SELECT * FROM wells WHERE organization_id = $1",
        "duration": "00:05:30"
      }
    ]
  }
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource conflict | 409 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Internal server error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | 503 |

## Pagination

List endpoints support pagination:

```http
GET /vendors?page=1&limit=20&sort=createdAt&order=desc
```

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Field to sort by
- `order`: Sort order (`asc` or `desc`)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## Filtering & Search

Many endpoints support filtering and search:

```http
GET /wells?status=ACTIVE&search=well-001&operatorId=123
```

## WebSocket Events

The API supports real-time updates via WebSocket:

### Connection
```javascript
const ws = new WebSocket('wss://api.wellflow.com/ws');
```

### Events
- `well:status:changed` - Well status updates
- `production:recorded` - New production data
- `alert:created` - New system alerts
- `maintenance:scheduled` - Maintenance scheduling

## SDKs & Libraries

### JavaScript/TypeScript SDK
```bash
npm install @wellflow/sdk
```

### Python SDK
```bash
pip install wellflow-sdk
```

### .NET SDK
```bash
dotnet add package WellFlow.SDK
```

## Support

For API support and questions:
- **Email**: api-support@wellflow.com
- **Documentation**: https://docs.wellflow.com
- **Status Page**: https://status.wellflow.com

## Changelog

### v1.0.0 (Current)
- Initial API release
- Comprehensive monitoring and alerting
- Circuit breaker resilience patterns
- Advanced security and compliance features

---

**WellFlow API - Built for the oil & gas industry with enterprise-grade reliability and security.**