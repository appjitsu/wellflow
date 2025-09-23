# WellFlow Queue UI Dashboard

A standalone BullMQ monitoring dashboard for the WellFlow oil & gas production management system.

## Overview

This service provides a web-based interface for monitoring background job queues in the WellFlow system. It's designed to be deployed as a separate service on Railway, providing dedicated monitoring capabilities for:

- Data validation jobs
- Report generation jobs  
- Email notification jobs

## Features

- **Bull-Board Integration**: Full-featured queue monitoring dashboard
- **JWT Authentication**: Secure access using tokens from the main API
- **Role-Based Access**: Admin, Operator, and Manager roles supported
- **Health Monitoring**: Built-in health checks for Railway deployment
- **Security Headers**: Helmet.js for production security
- **CORS Support**: Configurable cross-origin resource sharing
- **Graceful Shutdown**: Proper cleanup of Redis connections and queues

## Development

### Prerequisites

- Node.js 18+
- Redis server
- Access to WellFlow API for JWT tokens

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env

# Start development server
pnpm run dev
```

### Environment Variables

```bash
PORT=3003                                    # Server port
REDIS_URL=redis://localhost:6379            # Redis connection
JWT_SECRET=your-secret-key                  # JWT validation secret
API_BASE_URL=http://localhost:3001          # Main API URL
ALLOWED_ORIGINS=http://localhost:3000       # CORS origins
NODE_ENV=development                         # Environment
```

## Authentication

The dashboard requires a valid JWT token from the WellFlow API. You can provide the token in two ways:

1. **Authorization Header**: `Authorization: Bearer <token>`
2. **Query Parameter**: `?token=<token>`

### Required Roles

Access requires one of the following roles:
- `ADMIN` - Full access to all queue operations
- `OPERATOR` - View and basic queue operations  
- `MANAGER` - View and management operations

## API Endpoints

- `GET /health` - Health check (no auth required)
- `GET /api/info` - Service information (no auth required)
- `GET /` - Bull-Board dashboard (auth required)

## Deployment

### Railway Deployment

This service is configured for Railway deployment with:

- **Dockerfile**: Multi-stage build with security best practices
- **railway.json**: Railway-specific configuration
- **Health Checks**: Automatic health monitoring
- **Auto-scaling**: Configured for production workloads

### Environment Variables (Railway)

Railway will automatically provide:
- `RAILWAY_ENVIRONMENT`
- `RAILWAY_SERVICE_NAME` 
- `RAILWAY_PROJECT_NAME`

You need to configure:
- `REDIS_URL` - Connection to Railway Redis service
- `JWT_SECRET` - Must match main API secret
- `ALLOWED_ORIGINS` - Your domain origins

### Security

- Non-root Docker user
- Security headers via Helmet.js
- JWT token validation
- Role-based access control
- Request logging for audit trails
- CORS protection

## Monitoring

The service provides comprehensive monitoring:

- Health check endpoint at `/health`
- Structured JSON logging
- Redis connection status
- Queue status monitoring
- Authentication audit logs

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WellFlow API  │    │   Queue UI      │    │   Redis/BullMQ  │
│                 │    │   Dashboard     │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ JWT Tokens  │◄┼────┼►│ Auth Check  │ │    │ │   Queues    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │ ┌─────────────┐ │    │                 │
│ ┌─────────────┐ │    │ │ Bull-Board  │◄┼────┼►┌─────────────┐ │
│ │ Job Queues  │◄┼────┼►│ Dashboard   │ │    │ │ Job Data    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Testing & Development Tools

### Generate Test Jobs

Create realistic oil & gas industry test data for development:

```bash
node generate-test-jobs.js
```

This creates **39 test jobs** across all queues with realistic data including:
- Well production data with geographic locations (Texas counties)
- Safety alerts and compliance notifications
- Environmental, production, and safety reports

### Generate Authentication Tokens

For development and testing:

```bash
node generate-test-token.js
```

Creates a 24-hour JWT token with ADMIN and OPERATOR roles.

## Queue Types Monitored

| Queue | Purpose | Example Jobs |
|-------|---------|--------------|
| **data-validation** | Production data validation | Well data integrity, compliance checks |
| **report-generation** | Regulatory & operational reports | Environmental quarterly, production daily |
| **email-notifications** | Critical alerts & notifications | Safety alerts, permit renewals |

## 📚 Complete Documentation

For comprehensive documentation including:
- **Detailed Architecture** - System integration and design patterns
- **API Reference** - Complete endpoint documentation
- **Security Guide** - Authentication, authorization, and best practices
- **Troubleshooting** - Common issues and solutions
- **Deployment Guide** - Production deployment instructions
- **Performance Tuning** - Optimization and scaling considerations

See: **[📖 DOCUMENTATION.md](./DOCUMENTATION.md)**

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include security considerations
4. Update documentation
5. Test authentication flows

## License

UNLICENSED - Internal WellFlow project
