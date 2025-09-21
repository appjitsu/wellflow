#!/bin/bash

# WellFlow Application Backup Script
# Comprehensive backup solution for application files, configurations, and assets
# Supports both Railway production and local development environments
# Usage: ./scripts/application-backup.sh [--environment prod|dev] [--encrypt] [--verify]

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
BACKUP_DIR="$PROJECT_ROOT/backups/application"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$BACKUP_DIR/app-backup-$TIMESTAMP.log"

# Default values
ENVIRONMENT="dev"
ENCRYPT_BACKUP=false
VERIFY_BACKUP=false
RETENTION_DAYS=30

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

# Function to create application code backup
backup_application_code() {
  local backup_file="$BACKUP_DIR/wellflow-app-$ENVIRONMENT-$TIMESTAMP.tar.gz"
  
  log "${BLUE}📦 Creating application code backup...${NC}"
  log "Backup file: $backup_file"
  
  # Define what to include in the backup
  local include_patterns=(
    "apps/"
    "packages/"
    "docs/"
    "scripts/"
    "*.json"
    "*.js"
    "*.ts"
    "*.md"
    "*.yml"
    "*.yaml"
    "*.config.*"
    "Dockerfile*"
    ".env.example"
  )
  
  # Define what to exclude from the backup
  local exclude_patterns=(
    "node_modules"
    ".next"
    "dist"
    "build"
    "coverage"
    ".git"
    "backups"
    "security-reports"
    "performance-reports"
    "accessibility-reports"
    "license-reports"
    "*.log"
    ".env"
    ".env.local"
    ".env.production"
    "*.tmp"
    "*.temp"
  )
  
  # Build tar command with includes and excludes
  local tar_cmd="tar -czf $backup_file -C $PROJECT_ROOT"
  
  # Add exclude patterns
  for pattern in "${exclude_patterns[@]}"; do
    tar_cmd="$tar_cmd --exclude=$pattern"
  done
  
  # Add include patterns
  for pattern in "${include_patterns[@]}"; do
    if [[ -e "$PROJECT_ROOT/$pattern" ]]; then
      tar_cmd="$tar_cmd $pattern"
    fi
  done
  
  # Execute tar command
  if eval "$tar_cmd"; then
    log "${GREEN}✅ Application code backup created${NC}"
    BACKUP_FILES+=("$backup_file")
  else
    log "${RED}❌ Application code backup failed${NC}"
    exit 1
  fi
}

# Function to backup configuration files
backup_configurations() {
  local config_backup_file="$BACKUP_DIR/wellflow-config-$ENVIRONMENT-$TIMESTAMP.tar.gz"
  
  log "${BLUE}📋 Creating configuration backup...${NC}"
  log "Config backup file: $config_backup_file"
  
  # Create temporary directory for config files
  local temp_config_dir="$BACKUP_DIR/temp-config-$TIMESTAMP"
  mkdir -p "$temp_config_dir"
  
  # Copy configuration files
  local config_files=(
    "package.json"
    "pnpm-workspace.yaml"
    "turbo.json"
    "jest.config.js"
    "jest.setup.js"
    "jest.global-setup.js"
    "jest.global-teardown.js"
    "lighthouse.config.js"
    "performance-budget.json"
    "security-config.json"
    "accessibility-config.example.json"
    "docker-compose.dev.yml"
    ".env.example"
  )
  
  for config_file in "${config_files[@]}"; do
    if [[ -f "$PROJECT_ROOT/$config_file" ]]; then
      cp "$PROJECT_ROOT/$config_file" "$temp_config_dir/"
      log "Backed up: $config_file"
    fi
  done
  
  # Copy package.json files from apps and packages
  find "$PROJECT_ROOT/apps" "$PROJECT_ROOT/packages" -name "package.json" -type f 2>/dev/null | while read -r pkg_file; do
    local rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$pkg_file")
    local dest_dir="$temp_config_dir/$(dirname "$rel_path")"
    mkdir -p "$dest_dir"
    cp "$pkg_file" "$dest_dir/"
    log "Backed up: $rel_path"
  done
  
  # Copy TypeScript and ESLint configs
  find "$PROJECT_ROOT" -maxdepth 3 -name "tsconfig*.json" -o -name ".eslintrc*" -o -name "prettier.config.*" 2>/dev/null | while read -r config_file; do
    local rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$config_file")
    local dest_dir="$temp_config_dir/$(dirname "$rel_path")"
    mkdir -p "$dest_dir"
    cp "$config_file" "$dest_dir/"
    log "Backed up: $rel_path"
  done
  
  # Create tar archive of config files
  if tar -czf "$config_backup_file" -C "$temp_config_dir" .; then
    log "${GREEN}✅ Configuration backup created${NC}"
    BACKUP_FILES+=("$config_backup_file")
  else
    log "${RED}❌ Configuration backup failed${NC}"
    exit 1
  fi
  
  # Clean up temporary directory
  rm -rf "$temp_config_dir"
}

# Function to backup environment variables (sanitized)
backup_environment_variables() {
  local env_backup_file="$BACKUP_DIR/wellflow-env-$ENVIRONMENT-$TIMESTAMP.json"
  
  log "${BLUE}🔐 Creating environment variables backup (sanitized)...${NC}"
  log "Environment backup file: $env_backup_file"
  
  # Create sanitized environment backup
  cat > "$env_backup_file" << EOF
{
  "backup_id": "wellflow-env-$ENVIRONMENT-$TIMESTAMP",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$ENVIRONMENT",
  "note": "This backup contains sanitized environment variable names only, not values",
  "variables": {
EOF

  local first=true
  
  # Get environment variables (sanitized - names only, no values)
  env | grep -E '^(DB_|REDIS_|NODE_|PORT|NEXT_|API_)' | cut -d= -f1 | sort | while read -r var_name; do
    if [[ "$first" == true ]]; then
      first=false
    else
      echo "," >> "$env_backup_file"
    fi
    
    echo "    \"$var_name\": \"[REDACTED]\"" >> "$env_backup_file"
  done
  
  cat >> "$env_backup_file" << EOF
  },
  "required_variables": [
    "DB_HOST",
    "DB_PORT", 
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "REDIS_URL",
    "NODE_ENV",
    "PORT",
    "NEXT_PUBLIC_API_URL"
  ],
  "optional_variables": [
    "BACKUP_ENCRYPTION_KEY",
    "SENTRY_DSN",
    "LOGROCK_APP_ID",
    "UPLOADTHING_SECRET",
    "RESEND_API_KEY"
  ]
}
EOF

  log "${GREEN}✅ Environment variables backup created (sanitized)${NC}"
  BACKUP_FILES+=("$env_backup_file")
}

# Function to backup documentation
backup_documentation() {
  local docs_backup_file="$BACKUP_DIR/wellflow-docs-$ENVIRONMENT-$TIMESTAMP.tar.gz"
  
  log "${BLUE}📚 Creating documentation backup...${NC}"
  log "Documentation backup file: $docs_backup_file"
  
  if [[ -d "$PROJECT_ROOT/docs" ]]; then
    if tar -czf "$docs_backup_file" -C "$PROJECT_ROOT" docs/; then
      log "${GREEN}✅ Documentation backup created${NC}"
      BACKUP_FILES+=("$docs_backup_file")
    else
      log "${RED}❌ Documentation backup failed${NC}"
      exit 1
    fi
  else
    log "${YELLOW}⚠️  Documentation directory not found${NC}"
  fi
}

# Function to backup scripts
backup_scripts() {
  local scripts_backup_file="$BACKUP_DIR/wellflow-scripts-$ENVIRONMENT-$TIMESTAMP.tar.gz"
  
  log "${BLUE}🔧 Creating scripts backup...${NC}"
  log "Scripts backup file: $scripts_backup_file"
  
  if [[ -d "$PROJECT_ROOT/scripts" ]]; then
    if tar -czf "$scripts_backup_file" -C "$PROJECT_ROOT" scripts/; then
      log "${GREEN}✅ Scripts backup created${NC}"
      BACKUP_FILES+=("$scripts_backup_file")
    else
      log "${RED}❌ Scripts backup failed${NC}"
      exit 1
    fi
  else
    log "${YELLOW}⚠️  Scripts directory not found${NC}"
  fi
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
    
    local encrypted_files=()
    for file in "${BACKUP_FILES[@]}"; do
      if [[ -f "$file" ]]; then
        log "Encrypting: $file"
        gpg --cipher-algo AES256 --compress-algo 1 --symmetric --output "$file.gpg" "$file"
        
        if [[ -f "$file.gpg" ]]; then
          rm "$file"
          encrypted_files+=("$file.gpg")
          log "${GREEN}✅ Encrypted: $file.gpg${NC}"
        else
          log "${RED}❌ Encryption failed for: $file${NC}"
        fi
      fi
    done
    
    BACKUP_FILES=("${encrypted_files[@]}")
  fi
}

# Function to verify backup integrity
verify_backup() {
  if [[ "$VERIFY_BACKUP" == true ]]; then
    log "${BLUE}🔍 Verifying backup integrity...${NC}"
    
    for file in "${BACKUP_FILES[@]}"; do
      if [[ -f "$file" ]]; then
        local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [[ "$file_size" -gt 1024 ]]; then
          log "${GREEN}✅ Backup file size OK: $file ($file_size bytes)${NC}"
          
          # Test tar files (if not encrypted)
          if [[ "$file" == *.tar.gz && "$ENCRYPT_BACKUP" == false ]]; then
            if tar -tzf "$file" > /dev/null 2>&1; then
              log "${GREEN}✅ Tar file structure valid: $file${NC}"
            else
              log "${RED}❌ Tar file structure invalid: $file${NC}"
              exit 1
            fi
          fi
        else
          log "${RED}❌ Backup file too small: $file ($file_size bytes)${NC}"
          exit 1
        fi
      else
        log "${RED}❌ Backup file not found: $file${NC}"
        exit 1
      fi
    done
  fi
}

# Function to clean up old backups
cleanup_old_backups() {
  log "${BLUE}🧹 Cleaning up old application backups (retention: $RETENTION_DAYS days)...${NC}"
  
  find "$BACKUP_DIR" -name "wellflow-*-$ENVIRONMENT-*" -type f -mtime +$RETENTION_DAYS -delete
  find "$BACKUP_DIR" -name "app-backup-*.log" -type f -mtime +$RETENTION_DAYS -delete
  
  log "${GREEN}✅ Old application backups cleaned up${NC}"
}

# Function to generate backup report
generate_report() {
  local report_file="$BACKUP_DIR/app-backup-report-$TIMESTAMP.json"
  
  log "${BLUE}📊 Generating application backup report...${NC}"
  
  cat > "$report_file" << EOF
{
  "backup_id": "wellflow-app-$ENVIRONMENT-$TIMESTAMP",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "$ENVIRONMENT",
  "backup_type": "application",
  "configuration": {
    "encrypted": $ENCRYPT_BACKUP,
    "verified": $VERIFY_BACKUP,
    "retention_days": $RETENTION_DAYS
  },
  "components": [
    "application_code",
    "configurations",
    "environment_variables",
    "documentation",
    "scripts"
  ],
  "files": [
EOF

  local first=true
  for file in "${BACKUP_FILES[@]}"; do
    if [[ -f "$file" ]]; then
      if [[ "$first" == false ]]; then
        echo "," >> "$report_file"
      fi
      
      local file_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
      local file_hash=$(shasum -a 256 "$file" | cut -d' ' -f1)
      
      cat >> "$report_file" << EOF
    {
      "filename": "$(basename "$file")",
      "path": "$file",
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

  log "${GREEN}✅ Application backup report generated: $report_file${NC}"
}

# Main execution
main() {
  log "${BLUE}🚀 WellFlow Application Backup Starting${NC}"
  log "============================================"
  
  # Initialize backup files array
  BACKUP_FILES=()
  
  # Create different backup components
  backup_application_code
  backup_configurations
  backup_environment_variables
  backup_documentation
  backup_scripts
  
  # Encrypt backup if requested
  encrypt_backup
  
  # Verify backup if requested
  verify_backup
  
  # Generate backup report
  generate_report
  
  # Clean up old backups
  cleanup_old_backups
  
  log "${GREEN}🎉 Application backup completed successfully!${NC}"
  log "Backup files: ${BACKUP_FILES[*]}"
  log "Log file: $LOG_FILE"
}

# Handle script termination
trap 'log "${RED}❌ Application backup interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"
