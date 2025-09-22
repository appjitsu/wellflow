#!/bin/bash

# Database Testing Script for WellFlow API
# Comprehensive testing suite for database models, relationships, and business rules

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_DB_NAME=${TEST_DB_NAME:-"wellflow_test"}
TEST_DB_HOST=${TEST_DB_HOST:-"localhost"}
TEST_DB_PORT=${TEST_DB_PORT:-"5433"}
TEST_DB_USER=${TEST_DB_USER:-"postgres"}
TEST_DB_PASSWORD=${TEST_DB_PASSWORD:-"password"}

echo -e "${BLUE}🧪 WellFlow Database Testing Suite${NC}"
echo -e "${BLUE}===================================${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL connection..."
    
    if pg_isready -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" >/dev/null 2>&1; then
        print_success "PostgreSQL is running and accessible"
        return 0
    else
        print_error "PostgreSQL is not accessible at $TEST_DB_HOST:$TEST_DB_PORT"
        print_warning "Please ensure PostgreSQL is running and accessible"
        print_warning "You can start it with: docker-compose up -d postgres"
        return 1
    fi
}

# Function to setup test database
setup_test_db() {
    print_status "Setting up test database..."
    
    # Create test database if it doesn't exist
    PGPASSWORD="$TEST_DB_PASSWORD" createdb -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" "$TEST_DB_NAME" 2>/dev/null || true
    
    # Run migrations
    print_status "Running database migrations..."
    DB_NAME="$TEST_DB_NAME" DB_HOST="$TEST_DB_HOST" DB_PORT="$TEST_DB_PORT" DB_USER="$TEST_DB_USER" DB_PASSWORD="$TEST_DB_PASSWORD" pnpm db:migrate
    
    print_success "Test database setup complete"
}

# Function to cleanup test database
cleanup_test_db() {
    print_status "Cleaning up test database..."
    
    PGPASSWORD="$TEST_DB_PASSWORD" dropdb -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" "$TEST_DB_NAME" --if-exists
    
    print_success "Test database cleanup complete"
}

# Function to run specific test suite
run_test_suite() {
    local test_name=$1
    local test_file=$2
    
    print_status "Running $test_name tests..."
    
    if pnpm test:db --testNamePattern="$test_file" --verbose; then
        print_success "$test_name tests passed"
        return 0
    else
        print_error "$test_name tests failed"
        return 1
    fi
}

# Function to run all database tests
run_all_tests() {
    print_status "Running comprehensive database test suite..."
    
    local failed_tests=()
    
    # Schema validation tests
    if ! run_test_suite "Schema Validation" "Database Schema Tests"; then
        failed_tests+=("Schema Validation")
    fi
    
    # CRUD operations tests
    if ! run_test_suite "CRUD Operations" "Database CRUD Operations Tests"; then
        failed_tests+=("CRUD Operations")
    fi
    
    # Business rules tests
    if ! run_test_suite "Business Rules" "Database Business Rules Tests"; then
        failed_tests+=("Business Rules")
    fi
    
    # Relationships tests
    if ! run_test_suite "Relationships" "Database Relationships Tests"; then
        failed_tests+=("Relationships")
    fi
    
    # Seed data tests
    if ! run_test_suite "Seed Data" "Database Seed Tests"; then
        failed_tests+=("Seed Data")
    fi
    
    # Summary
    echo ""
    echo -e "${BLUE}📊 Test Results Summary${NC}"
    echo -e "${BLUE}======================${NC}"
    
    if [ ${#failed_tests[@]} -eq 0 ]; then
        print_success "All database tests passed! 🎉"
        return 0
    else
        print_error "Some tests failed:"
        for test in "${failed_tests[@]}"; do
            echo -e "  ${RED}• $test${NC}"
        done
        return 1
    fi
}

# Function to run tests with coverage
run_tests_with_coverage() {
    print_status "Running database tests with coverage..."
    
    if pnpm test:db:coverage; then
        print_success "Database tests with coverage completed"
        print_status "Coverage report available in coverage/ directory"
        return 0
    else
        print_error "Database tests with coverage failed"
        return 1
    fi
}

# Function to validate database schema
validate_schema() {
    print_status "Validating database schema..."
    
    # Check if all expected tables exist
    local expected_tables=(
        "organizations"
        "users"
        "leases"
        "wells"
        "production_records"
        "partners"
        "lease_partners"
        "compliance_reports"
        "jib_statements"
        "documents"
        "equipment"
        "well_tests"
    )
    
    for table in "${expected_tables[@]}"; do
        if PGPASSWORD="$TEST_DB_PASSWORD" psql -h "$TEST_DB_HOST" -p "$TEST_DB_PORT" -U "$TEST_DB_USER" -d "$TEST_DB_NAME" -c "\dt $table" | grep -q "$table"; then
            print_success "Table '$table' exists"
        else
            print_error "Table '$table' is missing"
            return 1
        fi
    done
    
    print_success "All expected tables are present"
}

# Function to show help
show_help() {
    echo "WellFlow Database Testing Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     - Setup test database and run migrations"
    echo "  test      - Run all database tests"
    echo "  coverage  - Run tests with coverage report"
    echo "  validate  - Validate database schema"
    echo "  cleanup   - Cleanup test database"
    echo "  help      - Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  TEST_DB_NAME     - Test database name (default: wellflow_test)"
    echo "  TEST_DB_HOST     - Database host (default: localhost)"
    echo "  TEST_DB_PORT     - Database port (default: 5433)"
    echo "  TEST_DB_USER     - Database user (default: postgres)"
    echo "  TEST_DB_PASSWORD - Database password (default: password)"
    echo ""
    echo "Examples:"
    echo "  $0 setup"
    echo "  $0 test"
    echo "  $0 coverage"
    echo "  TEST_DB_NAME=my_test_db $0 test"
}

# Main execution
main() {
    local command=${1:-"test"}
    
    case $command in
        "setup")
            check_postgres || exit 1
            setup_test_db
            validate_schema
            ;;
        "test")
            check_postgres || exit 1
            setup_test_db
            run_all_tests
            ;;
        "coverage")
            check_postgres || exit 1
            setup_test_db
            run_tests_with_coverage
            ;;
        "validate")
            check_postgres || exit 1
            validate_schema
            ;;
        "cleanup")
            cleanup_test_db
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Export environment variables
export TEST_DB_NAME TEST_DB_HOST TEST_DB_PORT TEST_DB_USER TEST_DB_PASSWORD

# Run main function
main "$@"
