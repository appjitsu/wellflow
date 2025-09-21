#!/bin/bash

# WellFlow Backup Testing and Verification Script
# Comprehensive testing suite for backup integrity and restore procedures
# Usage: ./scripts/backup-test.sh [--environment prod|dev] [--type database|redis|application|all] [--restore-test]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
TEST_DIR="$PROJECT_ROOT/backup-tests"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$TEST_DIR/backup-test-$TIMESTAMP.log"

# Default values
ENVIRONMENT="dev"
TEST_TYPE="all"
RESTORE_TEST=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --type)
      TEST_TYPE="$2"
      shift 2
      ;;
    --restore-test)
      RESTORE_TEST=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      echo "Usage: $0 [--environment prod|dev] [--type database|redis|application|all] [--restore-test]"
      exit 1
      ;;
  esac
done

# Create test directory
mkdir -p "$TEST_DIR"

# Function to log with timestamp
log() {
  local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$message" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Function to record test result
record_test_result() {
  local test_name="$1"
  local result="$2"
  
  if [[ "$result" == "PASS" ]]; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
    log "${GREEN}✅ PASS: $test_name${NC}"
  else
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("$test_name")
    log "${RED}❌ FAIL: $test_name${NC}"
  fi
}

# Function to test database backup integrity
test_database_backup() {
  log "${BLUE}🗄️  Testing database backup integrity...${NC}"
  
  # Find latest database backup
  local latest_backup=$(find "$BACKUP_DIR" -name "wellflow-full-$ENVIRONMENT-*.dump" -type f | sort | tail -1)
  
  if [[ -z "$latest_backup" ]]; then
    record_test_result "Database backup exists" "FAIL"
    return
  fi
  
  record_test_result "Database backup exists" "PASS"
  log "Testing backup: $latest_backup"
  
  # Test 1: File size check
  local file_size=$(stat -f%z "$latest_backup" 2>/dev/null || stat -c%s "$latest_backup" 2>/dev/null)
  if [[ "$file_size" -gt 10240 ]]; then  # > 10KB
    record_test_result "Database backup file size" "PASS"
  else
    record_test_result "Database backup file size" "FAIL"
  fi
  
  # Test 2: pg_restore --list test
  if command_exists pg_restore; then
    if pg_restore --list "$latest_backup" > /dev/null 2>&1; then
      record_test_result "Database backup structure" "PASS"
    else
      record_test_result "Database backup structure" "FAIL"
    fi
  else
    log "${YELLOW}⚠️  pg_restore not available, skipping structure test${NC}"
  fi
  
  # Test 3: Checksum verification
  local checksum_file="$latest_backup.sha256"
  if [[ -f "$checksum_file" ]]; then
    local stored_checksum=$(cat "$checksum_file")
    local current_checksum=$(shasum -a 256 "$latest_backup" | cut -d' ' -f1)
    
    if [[ "$stored_checksum" == "$current_checksum" ]]; then
      record_test_result "Database backup checksum" "PASS"
    else
      record_test_result "Database backup checksum" "FAIL"
    fi
  else
    log "${YELLOW}⚠️  No checksum file found for database backup${NC}"
  fi
  
  # Test 4: Restore test (if requested and safe)
  if [[ "$RESTORE_TEST" == true && "$ENVIRONMENT" == "dev" ]]; then
    test_database_restore "$latest_backup"
  fi
}

# Function to test database restore
test_database_restore() {
  local backup_file="$1"
  
  log "${BLUE}🔄 Testing database restore (development only)...${NC}"
  
  # Create test database
  local test_db="wellflow_restore_test_$TIMESTAMP"
  
  if command_exists createdb && command_exists pg_restore; then
    # Create test database
    if createdb -h localhost -p 5433 -U postgres "$test_db" 2>/dev/null; then
      log "Created test database: $test_db"
      
      # Restore backup to test database
      if pg_restore \
        --host=localhost \
        --port=5433 \
        --username=postgres \
        --dbname="$test_db" \
        --verbose \
        "$backup_file" > /dev/null 2>&1; then
        
        record_test_result "Database restore test" "PASS"
        
        # Test basic queries
        local table_count=$(psql -h localhost -p 5433 -U postgres -d "$test_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        
        if [[ "$table_count" -gt 0 ]]; then
          record_test_result "Database restore table count" "PASS"
          log "Restored $table_count tables"
        else
          record_test_result "Database restore table count" "FAIL"
        fi
      else
        record_test_result "Database restore test" "FAIL"
      fi
      
      # Clean up test database
      dropdb -h localhost -p 5433 -U postgres "$test_db" 2>/dev/null || true
      log "Cleaned up test database"
    else
      log "${YELLOW}⚠️  Could not create test database${NC}"
    fi
  else
    log "${YELLOW}⚠️  Database tools not available for restore test${NC}"
  fi
}

# Function to test Redis backup integrity
test_redis_backup() {
  log "${BLUE}📦 Testing Redis backup integrity...${NC}"
  
  # Find latest Redis backup
  local latest_backup=$(find "$BACKUP_DIR/redis" -name "redis-*-$ENVIRONMENT-*.gz" -type f | sort | tail -1)
  
  if [[ -z "$latest_backup" ]]; then
    record_test_result "Redis backup exists" "FAIL"
    return
  fi
  
  record_test_result "Redis backup exists" "PASS"
  log "Testing backup: $latest_backup"
  
  # Test 1: File size check
  local file_size=$(stat -f%z "$latest_backup" 2>/dev/null || stat -c%s "$latest_backup" 2>/dev/null)
  if [[ "$file_size" -gt 100 ]]; then  # > 100 bytes
    record_test_result "Redis backup file size" "PASS"
  else
    record_test_result "Redis backup file size" "FAIL"
  fi
  
  # Test 2: Gzip integrity test
  if gzip -t "$latest_backup" 2>/dev/null; then
    record_test_result "Redis backup compression" "PASS"
  else
    record_test_result "Redis backup compression" "FAIL"
  fi
  
  # Test 3: Content validation
  local temp_file="$TEST_DIR/redis-test-$TIMESTAMP.txt"
  if gunzip -c "$latest_backup" > "$temp_file" 2>/dev/null; then
    # Check if it's an RDB file or command dump
    if file "$temp_file" | grep -q "Redis" || head -1 "$temp_file" | grep -q "WellFlow Redis Backup"; then
      record_test_result "Redis backup content" "PASS"
    else
      record_test_result "Redis backup content" "FAIL"
    fi
    rm -f "$temp_file"
  else
    record_test_result "Redis backup content" "FAIL"
  fi
}

# Function to test application backup integrity
test_application_backup() {
  log "${BLUE}📱 Testing application backup integrity...${NC}"
  
  # Find latest application backups
  local app_backup=$(find "$BACKUP_DIR/application" -name "wellflow-app-$ENVIRONMENT-*.tar.gz" -type f | sort | tail -1)
  local config_backup=$(find "$BACKUP_DIR/application" -name "wellflow-config-$ENVIRONMENT-*.tar.gz" -type f | sort | tail -1)
  
  # Test application code backup
  if [[ -n "$app_backup" ]]; then
    record_test_result "Application backup exists" "PASS"
    
    # Test tar file integrity
    if tar -tzf "$app_backup" > /dev/null 2>&1; then
      record_test_result "Application backup structure" "PASS"
      
      # Check for key files
      local key_files=("apps/" "packages/" "package.json")
      local missing_files=()
      
      for key_file in "${key_files[@]}"; do
        if tar -tzf "$app_backup" | grep -q "$key_file"; then
          log "Found: $key_file"
        else
          missing_files+=("$key_file")
        fi
      done
      
      if [[ ${#missing_files[@]} -eq 0 ]]; then
        record_test_result "Application backup completeness" "PASS"
      else
        record_test_result "Application backup completeness" "FAIL"
        log "Missing files: ${missing_files[*]}"
      fi
    else
      record_test_result "Application backup structure" "FAIL"
    fi
  else
    record_test_result "Application backup exists" "FAIL"
  fi
  
  # Test configuration backup
  if [[ -n "$config_backup" ]]; then
    record_test_result "Configuration backup exists" "PASS"
    
    if tar -tzf "$config_backup" > /dev/null 2>&1; then
      record_test_result "Configuration backup structure" "PASS"
    else
      record_test_result "Configuration backup structure" "FAIL"
    fi
  else
    record_test_result "Configuration backup exists" "FAIL"
  fi
}

# Function to test backup automation
test_backup_automation() {
  log "${BLUE}🤖 Testing backup automation...${NC}"
  
  # Check if backup scripts exist and are executable
  local backup_scripts=(
    "$SCRIPT_DIR/database-backup.sh"
    "$SCRIPT_DIR/redis-backup.sh"
    "$SCRIPT_DIR/application-backup.sh"
  )
  
  for script in "${backup_scripts[@]}"; do
    if [[ -f "$script" && -x "$script" ]]; then
      record_test_result "Backup script $(basename "$script") executable" "PASS"
    else
      record_test_result "Backup script $(basename "$script") executable" "FAIL"
    fi
  done
  
  # Check for cron jobs or scheduled tasks (if applicable)
  if crontab -l 2>/dev/null | grep -q "backup"; then
    record_test_result "Backup automation scheduled" "PASS"
  else
    log "${YELLOW}⚠️  No backup automation detected in crontab${NC}"
  fi
}

# Function to test backup retention
test_backup_retention() {
  log "${BLUE}🗂️  Testing backup retention policies...${NC}"
  
  # Check database backup retention
  local db_backups=$(find "$BACKUP_DIR" -name "wellflow-full-$ENVIRONMENT-*.dump" -type f | wc -l)
  if [[ "$db_backups" -gt 0 && "$db_backups" -le 30 ]]; then
    record_test_result "Database backup retention" "PASS"
    log "Found $db_backups database backups"
  else
    record_test_result "Database backup retention" "FAIL"
    log "Found $db_backups database backups (expected 1-30)"
  fi
  
  # Check Redis backup retention
  local redis_backups=$(find "$BACKUP_DIR/redis" -name "redis-*-$ENVIRONMENT-*.gz" -type f 2>/dev/null | wc -l)
  if [[ "$redis_backups" -gt 0 && "$redis_backups" -le 14 ]]; then
    record_test_result "Redis backup retention" "PASS"
    log "Found $redis_backups Redis backups"
  else
    record_test_result "Redis backup retention" "FAIL"
    log "Found $redis_backups Redis backups (expected 1-14)"
  fi
  
  # Check application backup retention
  local app_backups=$(find "$BACKUP_DIR/application" -name "wellflow-app-$ENVIRONMENT-*.tar.gz" -type f 2>/dev/null | wc -l)
  if [[ "$app_backups" -gt 0 && "$app_backups" -le 30 ]]; then
    record_test_result "Application backup retention" "PASS"
    log "Found $app_backups application backups"
  else
    record_test_result "Application backup retention" "FAIL"
    log "Found $app_backups application backups (expected 1-30)"
  fi
}

# Function to generate test report
generate_test_report() {
  local report_file="$TEST_DIR/backup-test-report-$TIMESTAMP.json"
  
  log "${BLUE}📊 Generating backup test report...${NC}"
  
  cat > "$report_file" << EOF
{
  "test_id": "backup-test-$ENVIRONMENT-$TIMESTAMP",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$ENVIRONMENT",
  "test_type": "$TEST_TYPE",
  "restore_test_enabled": $RESTORE_TEST,
  "summary": {
    "total_tests": $((TESTS_PASSED + TESTS_FAILED)),
    "tests_passed": $TESTS_PASSED,
    "tests_failed": $TESTS_FAILED,
    "success_rate": $(echo "scale=2; $TESTS_PASSED * 100 / ($TESTS_PASSED + $TESTS_FAILED)" | bc -l 2>/dev/null || echo "0")
  },
  "failed_tests": [
EOF

  local first=true
  for failed_test in "${FAILED_TESTS[@]}"; do
    if [[ "$first" == false ]]; then
      echo "," >> "$report_file"
    fi
    echo "    \"$failed_test\"" >> "$report_file"
    first=false
  done

  cat >> "$report_file" << EOF
  ],
  "recommendations": [
EOF

  # Add recommendations based on failed tests
  first=true
  if [[ $TESTS_FAILED -gt 0 ]]; then
    for failed_test in "${FAILED_TESTS[@]}"; do
      if [[ "$first" == false ]]; then
        echo "," >> "$report_file"
      fi
      
      case "$failed_test" in
        *"backup exists"*)
          echo "    \"Run backup procedures to create missing backups\"" >> "$report_file"
          ;;
        *"file size"*)
          echo "    \"Investigate backup file size issues - may indicate incomplete backups\"" >> "$report_file"
          ;;
        *"structure"*)
          echo "    \"Verify backup file integrity and backup procedures\"" >> "$report_file"
          ;;
        *"checksum"*)
          echo "    \"Regenerate checksums or investigate data corruption\"" >> "$report_file"
          ;;
        *)
          echo "    \"Review and fix: $failed_test\"" >> "$report_file"
          ;;
      esac
      first=false
    done
  else
    echo "    \"All backup tests passed - no immediate action required\"" >> "$report_file"
  fi

  cat >> "$report_file" << EOF
  ],
  "next_test_date": "$(date -d "+1 month" -u +"%Y-%m-%dT%H:%M:%SZ")",
  "log_file": "$LOG_FILE"
}
EOF

  log "${GREEN}✅ Backup test report generated: $report_file${NC}"
}

# Main execution
main() {
  log "${BLUE}🚀 WellFlow Backup Testing Starting${NC}"
  log "========================================="
  log "Environment: $ENVIRONMENT"
  log "Test Type: $TEST_TYPE"
  log "Restore Test: $RESTORE_TEST"
  
  # Run tests based on type
  case "$TEST_TYPE" in
    "database")
      test_database_backup
      ;;
    "redis")
      test_redis_backup
      ;;
    "application")
      test_application_backup
      ;;
    "all")
      test_database_backup
      test_redis_backup
      test_application_backup
      test_backup_automation
      test_backup_retention
      ;;
    *)
      log "${RED}❌ Invalid test type: $TEST_TYPE${NC}"
      exit 1
      ;;
  esac
  
  # Generate test report
  generate_test_report
  
  # Final summary
  log "${BLUE}📋 Test Summary${NC}"
  log "Tests Passed: $TESTS_PASSED"
  log "Tests Failed: $TESTS_FAILED"
  log "Success Rate: $(echo "scale=1; $TESTS_PASSED * 100 / ($TESTS_PASSED + $TESTS_FAILED)" | bc -l 2>/dev/null || echo "0")%"
  
  if [[ $TESTS_FAILED -eq 0 ]]; then
    log "${GREEN}🎉 All backup tests passed!${NC}"
    exit 0
  else
    log "${RED}❌ Some backup tests failed. Review the report for details.${NC}"
    log "Failed tests: ${FAILED_TESTS[*]}"
    exit 1
  fi
}

# Handle script termination
trap 'log "${RED}❌ Backup testing interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"
