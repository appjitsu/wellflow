#!/bin/bash

# Development setup script for Wellflow API

echo "🚀 Setting up Wellflow API development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Generate secure random values for development
generate_secret() {
    openssl rand -hex 32
}

# Setup environment variables
echo "📝 Setting up environment variables..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
fi

# Generate secrets if they don't exist
if grep -q "^POSTGRES_PASSWORD=$" .env || grep -q "POSTGRES_PASSWORD=\${" .env; then
    POSTGRES_PASSWORD=$(generate_secret)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
    else
        sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${POSTGRES_PASSWORD}|" .env
    fi
    echo "✅ Generated POSTGRES_PASSWORD"
fi

if grep -q "^JWT_SECRET=$" .env || grep -q "JWT_SECRET=\${" .env; then
    JWT_SECRET=$(generate_secret)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    else
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
    fi
    echo "✅ Generated JWT_SECRET"
fi

# Set DB_PASSWORD to match POSTGRES_PASSWORD
if grep -q "^DB_PASSWORD=$" .env; then
    POSTGRES_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env | cut -d'=' -f2)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^DB_PASSWORD=.*|DB_PASSWORD=${POSTGRES_PASSWORD}|" .env
    else
        sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${POSTGRES_PASSWORD}|" .env
    fi
fi

# Set default values for optional services (already done in .env file)

# Export environment variables for docker-compose
export $(grep -v '^#' .env | xargs)

echo "✅ Environment variables configured"

# Start PostgreSQL and Redis
echo "📦 Starting PostgreSQL and Redis containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"

    # Run database migrations
    echo "🗄️  Running database migrations..."
    pnpm run db:push

    echo ""
    echo "🎉 Development environment is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Run 'pnpm run dev' to start the API server"
    echo "2. Visit http://localhost:3001 to test the API"
    echo "3. Use 'pnpm run db:studio' to open Drizzle Studio"
    echo ""
    echo "To stop services: docker-compose down"
else
    echo "❌ Failed to start services. Check Docker logs:"
    docker-compose logs
fi
