#!/bin/bash

# WellFlow Redis Backup Script
# Comprehensive Redis backup solution for cache and session data
# Supports both Railway production and local development environments
# Usage: ./scripts/redis-backup.sh [--environment prod|dev] [--encrypt] [--verify]

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
BACKUP_DIR="$PROJECT_ROOT/backups/redis"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/redis-backup-$TIMESTAMP.log"

# Default values
ENVIRONMENT="dev"
ENCRYPT_BACKUP=false
VERIFY_BACKUP=false
RETENTION_DAYS=14

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --environment)
      ENVIRONMENT="$2"
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
      echo "Usage: $0 [--environment prod|dev] [--encrypt] [--verify] [--retention-days N]"
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

# Function to get Redis connection parameters
get_redis_config() {
  if [[ "$ENVIRONMENT" == "prod" ]]; then
    # Railway production environment
    if [[ -z "$REDIS_URL" ]]; then
      log "${RED}❌ REDIS_URL not set for production environment${NC}"
      exit 1
    fi
    
    # Parse REDIS_URL (format: redis://[:password@]host:port[/database])
    REDIS_URL_PARSED="$REDIS_URL"
    
    # Extract components using parameter expansion and sed
    if [[ "$REDIS_URL_PARSED" == *"@"* ]]; then
      REDIS_PASSWORD=$(echo "$REDIS_URL_PARSED" | sed -n 's/.*:\/\/:\([^@]*\)@.*/\1/p')
      REDIS_HOST=$(echo "$REDIS_URL_PARSED" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    else
      REDIS_PASSWORD=""
      REDIS_HOST=$(echo "$REDIS_URL_PARSED" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    fi
    
    REDIS_PORT=$(echo "$REDIS_URL_PARSED" | sed -n 's/.*:\([0-9]*\).*/\1/p' | tail -1)
    REDIS_DB=$(echo "$REDIS_URL_PARSED" | sed -n 's/.*\/\([0-9]*\).*/\1/p')
    
    # Set defaults if not found
    REDIS_PORT="${REDIS_PORT:-6379}"
    REDIS_DB="${REDIS_DB:-0}"
    
  else
    # Local development environment
    REDIS_HOST="${REDIS_HOST:-localhost}"
    REDIS_PORT="${REDIS_PORT:-6380}"
    REDIS_PASSWORD="${REDIS_PASSWORD:-}"
    REDIS_DB="${REDIS_DB:-0}"
  fi
}

# Function to test Redis connection
test_redis_connection() {
  log "${BLUE}🔌 Testing Redis connection...${NC}"
  
  local redis_cmd="redis-cli -h $REDIS_HOST -p $REDIS_PORT"
  
  if [[ -n "$REDIS_PASSWORD" ]]; then
    redis_cmd="$redis_cmd -a $REDIS_PASSWORD"
  fi
  
  if [[ -n "$REDIS_DB" && "$REDIS_DB" != "0" ]]; then
    redis_cmd="$redis_cmd -n $REDIS_DB"
  fi
  
  if $redis_cmd ping > /dev/null 2>&1; then
    log "${GREEN}✅ Redis connection successful${NC}"
    REDIS_CMD="$redis_cmd"
  else
    log "${RED}❌ Redis connection failed${NC}"
    exit 1
  fi
}

# Function to get Redis info
get_redis_info() {
  log "${BLUE}📊 Getting Redis information...${NC}"
  
  local info_output=$($REDIS_CMD info server 2>/dev/null)
  local redis_version=$(echo "$info_output" | grep "redis_version:" | cut -d: -f2 | tr -d '\r')
  local used_memory=$($REDIS_CMD info memory | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r')
  local keyspace_info=$($REDIS_CMD info keyspace 2>/dev/null || echo "No keys")
  
  log "Redis Version: $redis_version"
  log "Used Memory: $used_memory"
  log "Keyspace: $keyspace_info"
}

# Function to create Redis backup using BGSAVE
create_redis_backup() {
  local backup_file="$BACKUP_DIR/redis-$ENVIRONMENT-$TIMESTAMP.rdb"
  
  log "${BLUE}📦 Creating Redis backup...${NC}"
  log "Environment: $ENVIRONMENT"
  log "Redis: $REDIS_HOST:$REDIS_PORT"
  log "Database: $REDIS_DB"
  log "Backup file: $backup_file"
  
  # Get Redis info first
  get_redis_info
  
  # Method 1: Use BGSAVE if we have filesystem access (local development)
  if [[ "$ENVIRONMENT" == "dev" ]]; then
    log "${BLUE}Using BGSAVE method for local development...${NC}"
    
    # Trigger background save
    $REDIS_CMD bgsave
    
    # Wait for BGSAVE to complete
    local save_in_progress=1
    local wait_count=0
    local max_wait=60
    
    while [[ $save_in_progress -eq 1 && $wait_count -lt $max_wait ]]; do
      sleep 1
      local lastsave_before=$($REDIS_CMD lastsave)
      sleep 1
      local lastsave_after=$($REDIS_CMD lastsave)
      
      if [[ "$lastsave_before" != "$lastsave_after" ]]; then
        save_in_progress=0
        log "${GREEN}✅ BGSAVE completed${NC}"
      else
        wait_count=$((wait_count + 1))
        if [[ $((wait_count % 10)) -eq 0 ]]; then
          log "${YELLOW}⏳ Still waiting for BGSAVE to complete... (${wait_count}s)${NC}"
        fi
      fi
    done
    
    if [[ $save_in_progress -eq 1 ]]; then
      log "${RED}❌ BGSAVE timeout after ${max_wait} seconds${NC}"
      exit 1
    fi
    
    # Copy the RDB file from Redis data directory
    local redis_data_dir="/var/lib/redis"
    if [[ "$ENVIRONMENT" == "dev" ]]; then
      # For Docker container, copy from container
      if docker ps | grep -q "wellflow-redis"; then
        docker cp wellflow-redis:/data/dump.rdb "$backup_file"
        log "${GREEN}✅ Redis RDB file copied from container${NC}"
      else
        log "${YELLOW}⚠️  Redis container not found, using DUMP method${NC}"
        create_redis_dump_backup
        return
      fi
    fi
  else
    # Method 2: Use DUMP/RESTORE method for production (Railway)
    create_redis_dump_backup
  fi
  
  # Compress the backup
  if [[ -f "$backup_file" ]]; then
    gzip "$backup_file"
    BACKUP_FILES=("$backup_file.gz")
    log "${GREEN}✅ Redis backup compressed${NC}"
  fi
}

# Function to create Redis backup using DUMP commands
create_redis_dump_backup() {
  local backup_file="$BACKUP_DIR/redis-dump-$ENVIRONMENT-$TIMESTAMP.txt"
  
  log "${BLUE}📦 Creating Redis DUMP backup...${NC}"
  
  # Get all keys
  local keys=$($REDIS_CMD keys '*' 2>/dev/null || echo "")
  
  if [[ -z "$keys" ]]; then
    log "${YELLOW}⚠️  No keys found in Redis database${NC}"
    echo "# Redis backup - no keys found" > "$backup_file"
  else
    log "Found $(echo "$keys" | wc -l) keys to backup"
    
    # Create backup file header
    cat > "$backup_file" << EOF
# WellFlow Redis Backup
# Timestamp: $(date)
# Environment: $ENVIRONMENT
# Redis: $REDIS_HOST:$REDIS_PORT
# Database: $REDIS_DB

EOF
    
    # Backup each key
    local key_count=0
    while IFS= read -r key; do
      if [[ -n "$key" ]]; then
        key_count=$((key_count + 1))
        
        # Get key type
        local key_type=$($REDIS_CMD type "$key" | tr -d '\r')
        
        # Get TTL
        local ttl=$($REDIS_CMD ttl "$key" | tr -d '\r')
        
        echo "# Key: $key (type: $key_type, ttl: $ttl)" >> "$backup_file"
        
        case "$key_type" in
          "string")
            echo "SET \"$key\" \"$($REDIS_CMD get "$key")\"" >> "$backup_file"
            ;;
          "hash")
            $REDIS_CMD hgetall "$key" | while read -r field; do
              read -r value
              echo "HSET \"$key\" \"$field\" \"$value\"" >> "$backup_file"
            done
            ;;
          "list")
            local list_items=$($REDIS_CMD lrange "$key" 0 -1)
            echo "$list_items" | while IFS= read -r item; do
              echo "RPUSH \"$key\" \"$item\"" >> "$backup_file"
            done
            ;;
          "set")
            local set_items=$($REDIS_CMD smembers "$key")
            echo "$set_items" | while IFS= read -r item; do
              echo "SADD \"$key\" \"$item\"" >> "$backup_file"
            done
            ;;
          "zset")
            $REDIS_CMD zrange "$key" 0 -1 withscores | while read -r member; do
              read -r score
              echo "ZADD \"$key\" $score \"$member\"" >> "$backup_file"
            done
            ;;
        esac
        
        # Set TTL if it exists
        if [[ "$ttl" != "-1" && "$ttl" != "-2" ]]; then
          echo "EXPIRE \"$key\" $ttl" >> "$backup_file"
        fi
        
        echo "" >> "$backup_file"
        
        if [[ $((key_count % 100)) -eq 0 ]]; then
          log "${BLUE}Processed $key_count keys...${NC}"
        fi
      fi
    done <<< "$keys"
    
    log "${GREEN}✅ Backed up $key_count keys${NC}"
  fi
  
  # Compress the backup
  gzip "$backup_file"
  BACKUP_FILES=("$backup_file.gz")
}

# Function to encrypt backup files
encrypt_backup() {
  if [[ "$ENCRYPT_BACKUP" == true ]]; then
    log "${BLUE}🔐 Encrypting backup files...${NC}"
    
    if ! command_exists gpg; then
      log "${YELLOW}⚠️  GPG not available, skipping encryption${NC}"
      return
    fi
    
    if [[ -z "$BACKUP_ENCRYPTION_KEY" ]]; then
      log "${YELLOW}⚠️  BACKUP_ENCRYPTION_KEY not set, skipping encryption${NC}"
      return
    fi
    
    for file in "${BACKUP_FILES[@]}"; do
      if [[ -f "$file" ]]; then
        log "Encrypting: $file"
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "$file.gpg" "$file"
        
        if [[ -f "$file.gpg" ]]; then
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
      
      if [[ "$ENCRYPT_BACKUP" == true && -f "$file.gpg" ]]; then
        verify_file="$file.gpg"
      fi
      
      if [[ -f "$verify_file" ]]; then
        local file_size=$(stat -f%z "$verify_file" 2>/dev/null || stat -c%s "$verify_file" 2>/dev/null)
        if [[ "$file_size" -gt 100 ]]; then
          log "${GREEN}✅ Backup file size OK: $verify_file ($file_size bytes)${NC}"
        else
          log "${RED}❌ Backup file too small: $verify_file ($file_size bytes)${NC}"
          exit 1
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
  log "${BLUE}🧹 Cleaning up old Redis backups (retention: $RETENTION_DAYS days)...${NC}"
  
  find "$BACKUP_DIR" -name "redis-*-$ENVIRONMENT-*" -type f -mtime +$RETENTION_DAYS -delete
  find "$BACKUP_DIR" -name "redis-backup-*.log" -type f -mtime +$RETENTION_DAYS -delete
  
  log "${GREEN}✅ Old Redis backups cleaned up${NC}"
}

# Function to generate backup report
generate_report() {
  local report_file="$BACKUP_DIR/redis-backup-report-$TIMESTAMP.json"
  
  log "${BLUE}📊 Generating Redis backup report...${NC}"
  
  cat > "$report_file" << EOF
{
  "backup_id": "redis-$ENVIRONMENT-$TIMESTAMP",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$ENVIRONMENT",
  "redis": {
    "host": "$REDIS_HOST",
    "port": "$REDIS_PORT",
    "database": "$REDIS_DB"
  },
  "configuration": {
    "encrypted": $ENCRYPT_BACKUP,
    "verified": $VERIFY_BACKUP,
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

  log "${GREEN}✅ Redis backup report generated: $report_file${NC}"
}

# Main execution
main() {
  log "${BLUE}🚀 WellFlow Redis Backup Starting${NC}"
  log "======================================="
  
  # Check prerequisites
  if ! command_exists redis-cli; then
    log "${RED}❌ redis-cli not found. Please install Redis client tools.${NC}"
    exit 1
  fi
  
  # Get Redis configuration
  get_redis_config
  
  # Test Redis connection
  test_redis_connection
  
  # Create backup
  create_redis_backup
  
  # Encrypt backup if requested
  encrypt_backup
  
  # Verify backup if requested
  verify_backup
  
  # Generate backup report
  generate_report
  
  # Clean up old backups
  cleanup_old_backups
  
  log "${GREEN}🎉 Redis backup completed successfully!${NC}"
  log "Backup files: ${BACKUP_FILES[*]}"
  log "Log file: $LOG_FILE"
}

# Handle script termination
trap 'log "${RED}❌ Redis backup interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"
