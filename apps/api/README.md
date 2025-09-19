# Wellflow API

A NestJS API with Drizzle ORM, PostgreSQL, and Redis integration.

## Features

- **NestJS Framework**: Modern Node.js framework for building scalable server-side applications
- **Drizzle ORM**: Type-safe SQL ORM with excellent TypeScript support
- **PostgreSQL**: Robust relational database
- **Redis**: In-memory data structure store for caching
- **TypeScript**: Full type safety throughout the application

## Prerequisites

Before running the application, make sure you have the following installed:

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- pnpm (recommended package manager)

## Installation

```bash
# Install dependencies
pnpm install
```

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update the `.env` file with your database and Redis configurations:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=wellflow

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Application Configuration
PORT=3001
NODE_ENV=development
```

## Database Setup

1. Create a PostgreSQL database named `wellflow` (or whatever you specified in DB_NAME)

2. Generate and run database migrations:
```bash
# Generate migration files
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Or push schema directly (for development)
pnpm run db:push
```

3. (Optional) Open Drizzle Studio to view your database:
```bash
pnpm run db:studio
```

## Running the Application

```bash
# Development mode with hot reload
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `GET /users/email/:email` - Get user by email
- `POST /users` - Create a new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Example User Object
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## Database Scripts

```bash
# Generate migration files from schema changes
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Push schema directly to database (development only)
pnpm run db:push

# Open Drizzle Studio (database GUI)
pnpm run db:studio
```

## Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Project Structure

```
src/
├── database/           # Database configuration and schema
│   ├── database.module.ts
│   ├── database.service.ts
│   ├── schema.ts
│   └── migrations/     # Generated migration files
├── redis/              # Redis configuration
│   ├── redis.module.ts
│   └── redis.service.ts
├── users/              # Users module (example)
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── app.module.ts       # Main application module
└── main.ts            # Application entry point
```

## Technologies Used

- **NestJS**: Progressive Node.js framework
- **Drizzle ORM**: Modern TypeScript ORM
- **PostgreSQL**: Relational database
- **Redis**: Caching and session storage
- **TypeScript**: Type-safe JavaScript
