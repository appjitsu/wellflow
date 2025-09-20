# WellFlow

A comprehensive oil & gas well management platform built with modern web technologies and designed for cross-platform compatibility.

## Architecture

WellFlow is built as a monorepo using Turborepo with the following structure:

### Apps and Packages

- `api`: NestJS backend API with PostgreSQL and Redis
- `web`: Next.js web application
- `docs`: Documentation site (Next.js)
- `@repo/ui`: Shared React component library
- `@repo/eslint-config`: ESLint configurations
- `@repo/typescript-config`: TypeScript configurations

### Technology Stack

- **Backend**: NestJS, PostgreSQL with TimescaleDB, Redis
- **Frontend**: Next.js, React, TypeScript
- **Database**: PostgreSQL with TimescaleDB extension
- **Caching**: Redis
- **Deployment**: Railway (all services)
- **Monitoring**: Sentry, LogRocket
- **Email**: Resend (production), MailPit (development)
- **Maps**: Mapbox
- **SMS**: Twilio
- **Push Notifications**: Firebase
- **File Storage**: UploadThing

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/) with strict type checking enabled.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/wellflow.git
cd wellflow
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up local development services:

```bash
./scripts/setup-external-services.sh
```

4. Configure environment variables:

```bash
# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Edit the files with your configuration
```

5. Run database migrations:

```bash
cd apps/api
pnpm run db:migrate
```

### Development

To start all services in development mode:

```bash
pnpm dev
```

This will start:

- API server on http://localhost:3001
- Web application on http://localhost:3000
- Documentation on http://localhost:3002

### Individual Services

You can also run individual services:

```bash
# API only
pnpm dev --filter=api

# Web app only
pnpm dev --filter=web

# Documentation only
pnpm dev --filter=docs
```

### Building

To build all applications:

```bash
pnpm build
```

To build specific applications:

```bash
# Build API
pnpm build --filter=api

# Build web app
pnpm build --filter=web
```

## External Services

WellFlow integrates with several external services for cross-platform functionality:

- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session recording and user analytics
- **Firebase**: Push notifications, analytics, and crashlytics
- **Mapbox**: Maps and geospatial services
- **Twilio**: SMS notifications
- **Resend**: Email service (production)
- **MailPit**: Local email testing (development)
- **UploadThing**: File upload and storage

See [External Services Setup Guide](docs/external-services-setup.md) for detailed configuration instructions.

## Deployment

WellFlow is deployed on Railway with auto-deployment from Git:

- **API**: NestJS backend with PostgreSQL and Redis
- **Web**: Next.js frontend application
- **Docs**: Documentation site
- **Database**: PostgreSQL with TimescaleDB extension
- **Cache**: Redis for caching and background jobs

All services auto-deploy when changes are pushed to the main branch.

## Development Tools

### Local Services

The project includes Docker Compose configuration for local development:

```bash
# Start all local services (PostgreSQL, Redis, MailPit)
./scripts/setup-external-services.sh start

# Stop local services
./scripts/setup-external-services.sh stop

# Restart local services
./scripts/setup-external-services.sh restart
```

### Database Management

```bash
# Generate migration files
cd apps/api && pnpm run db:generate

# Run migrations
cd apps/api && pnpm run db:migrate

# Open Drizzle Studio (database GUI)
cd apps/api && pnpm run db:studio
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter=api
pnpm test --filter=web
```

## Documentation

- [External Services Setup](docs/external-services-setup.md)
- [Sprint Documentation](docs/sprints/)
- [Architecture Overview](docs/wellflow-technical-architecture.md)
- [API Documentation](apps/api/README.md)
- [Web App Documentation](apps/web/README.md)

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linting: `pnpm test && pnpm lint`
4. Create a pull request

## License

This project is proprietary software. All rights reserved.
