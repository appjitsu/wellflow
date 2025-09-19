#!/bin/bash

# Development setup script for Wellflow API

echo "🚀 Setting up Wellflow API development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start PostgreSQL and Redis
echo "📦 Starting PostgreSQL and Redis containers..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        echo "📝 Creating .env file from template..."
        cp .env.example .env
        echo "✅ .env file created. You can modify it if needed."
    fi
    
    # Run database migrations
    echo "🗄️  Running database migrations..."
    pnpm run db:push
    
    echo ""
    echo "🎉 Development environment is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Run 'pnpm run start:dev' to start the API server"
    echo "2. Visit http://localhost:3001 to test the API"
    echo "3. Use 'pnpm run db:studio' to open Drizzle Studio"
    echo ""
    echo "Available endpoints:"
    echo "- GET    /users           - Get all users"
    echo "- POST   /users           - Create a user"
    echo "- GET    /users/:id       - Get user by ID"
    echo "- GET    /users/email/:email - Get user by email"
    echo "- PUT    /users/:id       - Update user"
    echo "- DELETE /users/:id       - Delete user"
    echo ""
    echo "To stop services: docker-compose down"
else
    echo "❌ Failed to start services. Check Docker logs:"
    docker-compose logs
fi
