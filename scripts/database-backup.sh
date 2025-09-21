#!/bin/bash

# WellFlow Database Backup Script
# Comprehensive PostgreSQL/TimescaleDB backup solution for oil & gas production monitoring platform
# Supports both Railway production and local development environments
# Usage: ./scripts/database-backup.sh [--environment prod|dev] [--type full|incremental] [--encrypt] [--verify]

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
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/backup-$TIMESTAMP.log"

# Default values
ENVIRONMENT="dev"
BACKUP_TYPE="full"
ENCRYPT_BACKUP=false
VERIFY_BACKUP=false
RETENTION_DAYS=30
COMPRESSION_LEVEL=6

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --type)
      BACKUP_TYPE="$2"
      shift 2
      ;;
    --encrypt)
      ENCRYPT_BACKUP=true
      shift
      ;;
    --verify)
      VERIFY_BACKUP=true
      shift
      ;;
    --retention-days)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option $1"
      echo "Usage: $0 [--environment prod|dev] [--type full|incremental] [--encrypt] [--verify] [--retention-days N]"
      exit 1
      ;;
  esac
done

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log with timestamp
log() {
  local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$message" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to get database connection parameters
get_db_config() {
  if [[ "$ENVIRONMENT" == "prod" ]]; then
    # Railway production environment
    if [[ -z "$DATABASE_URL" ]]; then
      log "${RED}❌ DATABASE_URL not set for production environment${NC}"
      exit 1
    fi
    
    # Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
    DB_URL="$DATABASE_URL"
    DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_USER=$(echo "$DB_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo "$DB_URL" | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    
  else
    # Local development environment
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5433}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASSWORD="${DB_PASSWORD:-password}"
    DB_NAME="${DB_NAME:-wellflow}"
  fi
  
  # Set PGPASSWORD for pg_dump
  export PGPASSWORD="$DB_PASSWORD"
}

# Function to create full database backup
create_full_backup() {
  local backup_file="$BACKUP_DIR/wellflow-full-$ENVIRONMENT-$TIMESTAMP.sql"
  
  log "${BLUE}📦 Creating full database backup...${NC}"
  log "Environment: $ENVIRONMENT"
  log "Database: $DB_NAME"
  log "Host: $DB_HOST:$DB_PORT"
  log "Backup file: $backup_file"
  
  # Create backup with custom format for better compression and parallel restore
  if pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --compress="$COMPRESSION_LEVEL" \
    --verbose \
    --file="$backup_file.dump" \
    --no-password; then
    
    log "${GREEN}✅ Database backup created successfully${NC}"
    
    # Also create a plain SQL backup for easier inspection
    pg_dump \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --dbname="$DB_NAME" \
      --format=plain \
      --verbose \
      --file="$backup_file" \
      --no-password
    
    # Compress the SQL file
    gzip "$backup_file"
    
    BACKUP_FILES=("$backup_file.dump" "$backup_file.gz")
    
  else
    log "${RED}❌ Database backup failed${NC}"
    exit 1
  fi
}

# Function to create incremental backup (using WAL archiving simulation)
create_incremental_backup() {
  local backup_file="$BACKUP_DIR/wellflow-incremental-$ENVIRONMENT-$TIMESTAMP.sql"
  
  log "${BLUE}📦 Creating incremental database backup...${NC}"
  log "Note: This creates a full backup as PostgreSQL WAL archiving requires additional setup"
  
  # For now, create a full backup with timestamp-based naming
  # In production, this would use WAL-E, pgBackRest, or similar tools
  create_full_backup
}

# Function to encrypt backup files
encrypt_backup() {
  if [[ "$ENCRYPT_BACKUP" == true ]]; then
    log "${BLUE}🔐 Encrypting backup files...${NC}"
    
    # Check if GPG is available
    if ! command_exists gpg; then
      log "${YELLOW}⚠️  GPG not available, skipping encryption${NC}"
      return
    fi
    
    # Check if encryption key is configured
    if [[ -z "$BACKUP_ENCRYPTION_KEY" ]]; then
      log "${YELLOW}⚠️  BACKUP_ENCRYPTION_KEY not set, skipping encryption${NC}"
      return
    fi
    
    for file in "${BACKUP_FILES[@]}"; do
      if [[ -f "$file" ]]; then
        log "Encrypting: $file"
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "$file.gpg" "$file"
        
        # Verify encryption worked
        if [[ -f "$file.gpg" ]]; then
          # Remove unencrypted file
          rm "$file"
          log "${GREEN}✅ Encrypted: $file.gpg${NC}"
        else
          log "${RED}❌ Encryption failed for: $file${NC}"
        fi
      fi
    done
  fi
}

# Function to verify backup integrity
verify_backup() {
  if [[ "$VERIFY_BACKUP" == true ]]; then
    log "${BLUE}🔍 Verifying backup integrity...${NC}"
    
    for file in "${BACKUP_FILES[@]}"; do
      local verify_file="$file"
      
      # Handle encrypted files
      if [[ "$ENCRYPT_BACKUP" == true && -f "$file.gpg" ]]; then
        verify_file="$file.gpg"
      fi
      
      if [[ -f "$verify_file" ]]; then
        # Check file size
        local file_size=$(stat -f%z "$verify_file" 2>/dev/null || stat -c%s "$verify_file" 2>/dev/null)
        if [[ "$file_size" -gt 1024 ]]; then
          log "${GREEN}✅ Backup file size OK: $verify_file ($file_size bytes)${NC}"
        else
          log "${RED}❌ Backup file too small: $verify_file ($file_size bytes)${NC}"
          exit 1
        fi
        
        # For .dump files, verify with pg_restore --list
        if [[ "$verify_file" == *.dump && "$ENCRYPT_BACKUP" == false ]]; then
          if pg_restore --list "$verify_file" > /dev/null 2>&1; then
            log "${GREEN}✅ Backup file structure valid: $verify_file${NC}"
          else
            log "${RED}❌ Backup file structure invalid: $verify_file${NC}"
            exit 1
          fi
        fi
      else
        log "${RED}❌ Backup file not found: $verify_file${NC}"
        exit 1
      fi
    done
  fi
}

# Function to clean up old backups
cleanup_old_backups() {
  log "${BLUE}🧹 Cleaning up old backups (retention: $RETENTION_DAYS days)...${NC}"
  
  # Find and remove backups older than retention period
  find "$BACKUP_DIR" -name "wellflow-*-$ENVIRONMENT-*.sql*" -type f -mtime +$RETENTION_DAYS -delete
  find "$BACKUP_DIR" -name "wellflow-*-$ENVIRONMENT-*.dump*" -type f -mtime +$RETENTION_DAYS -delete
  find "$BACKUP_DIR" -name "backup-*.log" -type f -mtime +$RETENTION_DAYS -delete
  
  log "${GREEN}✅ Old backups cleaned up${NC}"
}

# Function to generate backup report
generate_report() {
  local report_file="$BACKUP_DIR/backup-report-$TIMESTAMP.json"
  
  log "${BLUE}📊 Generating backup report...${NC}"
  
  cat > "$report_file" << EOF
{
  "backup_id": "wellflow-$ENVIRONMENT-$TIMESTAMP",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$ENVIRONMENT",
  "backup_type": "$BACKUP_TYPE",
  "database": {
    "name": "$DB_NAME",
    "host": "$DB_HOST",
    "port": "$DB_PORT"
  },
  "configuration": {
    "encrypted": $ENCRYPT_BACKUP,
    "verified": $VERIFY_BACKUP,
    "compression_level": $COMPRESSION_LEVEL,
    "retention_days": $RETENTION_DAYS
  },
  "files": [
EOF

  local first=true
  for file in "${BACKUP_FILES[@]}"; do
    local actual_file="$file"
    if [[ "$ENCRYPT_BACKUP" == true && -f "$file.gpg" ]]; then
      actual_file="$file.gpg"
    fi
    
    if [[ -f "$actual_file" ]]; then
      if [[ "$first" == false ]]; then
        echo "," >> "$report_file"
      fi
      
      local file_size=$(stat -f%z "$actual_file" 2>/dev/null || stat -c%s "$actual_file" 2>/dev/null)
      local file_hash=$(shasum -a 256 "$actual_file" | cut -d' ' -f1)
      
      cat >> "$report_file" << EOF
    {
      "filename": "$(basename "$actual_file")",
      "path": "$actual_file",
      "size_bytes": $file_size,
      "sha256": "$file_hash"
    }
EOF
      first=false
    fi
  done

  cat >> "$report_file" << EOF
  ],
  "status": "completed",
  "log_file": "$LOG_FILE"
}
EOF

  log "${GREEN}✅ Backup report generated: $report_file${NC}"
}

# Main execution
main() {
  log "${BLUE}🚀 WellFlow Database Backup Starting${NC}"
  log "============================================="
  
  # Check prerequisites
  if ! command_exists pg_dump; then
    log "${RED}❌ pg_dump not found. Please install PostgreSQL client tools.${NC}"
    exit 1
  fi
  
  # Get database configuration
  get_db_config
  
  # Test database connection
  log "${BLUE}🔌 Testing database connection...${NC}"
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
    log "${GREEN}✅ Database connection successful${NC}"
  else
    log "${RED}❌ Database connection failed${NC}"
    exit 1
  fi
  
  # Create backup based on type
  case "$BACKUP_TYPE" in
    "full")
      create_full_backup
      ;;
    "incremental")
      create_incremental_backup
      ;;
    *)
      log "${RED}❌ Invalid backup type: $BACKUP_TYPE${NC}"
      exit 1
      ;;
  esac
  
  # Encrypt backup if requested
  encrypt_backup
  
  # Verify backup if requested
  verify_backup
  
  # Generate backup report
  generate_report
  
  # Clean up old backups
  cleanup_old_backups
  
  log "${GREEN}🎉 Database backup completed successfully!${NC}"
  log "Backup files: ${BACKUP_FILES[*]}"
  log "Log file: $LOG_FILE"
}

# Handle script termination
trap 'log "${RED}❌ Backup interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"
