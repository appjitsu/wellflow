#!/bin/bash

# WellFlow External Services Setup Script
# This script helps set up and verify external service configurations

set -e

echo "🚀 WellFlow External Services Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    echo ""
    print_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "All requirements met"
}

# Start local development services
start_local_services() {
    echo ""
    print_info "Starting local development services..."
    
    if [ -f "docker-compose.dev.yml" ]; then
        docker-compose -f docker-compose.dev.yml up -d
        print_status "Local services started (PostgreSQL, Redis, MailPit)"
        print_info "MailPit Web UI: http://localhost:8025"
        print_info "PostgreSQL: localhost:5433"
        print_info "Redis: localhost:6380"
    else
        print_error "docker-compose.dev.yml not found"
        exit 1
    fi
}

# Check environment variables
check_env_vars() {
    echo ""
    print_info "Checking environment variables..."
    
    # API environment variables
    if [ -f "apps/api/.env" ]; then
        print_status "API .env file exists"
    else
        print_warning "API .env file not found. Copy from .env.example and configure."
    fi
    
    # Web environment variables
    if [ -f "apps/web/.env.local" ]; then
        print_status "Web .env.local file exists"
    else
        print_warning "Web .env.local file not found. Copy from .env.example and configure."
    fi
}

# Test service connections
test_services() {
    echo ""
    print_info "Testing service connections..."
    
    # Test PostgreSQL
    if docker exec wellflow-postgres pg_isready -U postgres &> /dev/null; then
        print_status "PostgreSQL connection successful"
    else
        print_error "PostgreSQL connection failed"
    fi
    
    # Test Redis
    if docker exec wellflow-redis redis-cli ping | grep -q "PONG"; then
        print_status "Redis connection successful"
    else
        print_error "Redis connection failed"
    fi
    
    # Test MailPit
    if curl -s http://localhost:8025 &> /dev/null; then
        print_status "MailPit web interface accessible"
    else
        print_error "MailPit web interface not accessible"
    fi
}

# Display service URLs and next steps
show_info() {
    echo ""
    print_info "Service Information:"
    echo "==================="
    echo "📧 MailPit Web UI: http://localhost:8025"
    echo "🗄️  PostgreSQL: localhost:5433 (user: postgres, password: password, db: wellflow)"
    echo "🔴 Redis: localhost:6380"
    echo ""
    print_info "Next Steps:"
    echo "==========="
    echo "1. Configure external service accounts (see docs/external-services-setup.md)"
    echo "2. Update environment variables in .env files"
    echo "3. Add environment variables to Railway dashboard"
    echo "4. Test each service integration"
    echo "5. Run the application: pnpm dev"
    echo ""
    print_warning "Remember to never commit API keys to version control!"
}

# Main execution
main() {
    check_requirements
    start_local_services
    sleep 5  # Wait for services to start
    check_env_vars
    test_services
    show_info
}

# Handle script arguments
case "${1:-}" in
    "start")
        start_local_services
        ;;
    "stop")
        print_info "Stopping local services..."
        docker-compose -f docker-compose.dev.yml down
        print_status "Local services stopped"
        ;;
    "restart")
        print_info "Restarting local services..."
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml up -d
        print_status "Local services restarted"
        ;;
    "test")
        test_services
        ;;
    *)
        main
        ;;
esac
