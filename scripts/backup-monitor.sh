#!/bin/bash

# WellFlow Backup Monitoring and Alerting System
# Monitors backup operations, storage usage, and sends alerts for issues
# Usage: ./scripts/backup-monitor.sh [--check-all] [--alert-threshold 80] [--send-alerts]

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
MONITOR_DIR="$PROJECT_ROOT/security-reports/backup-monitoring"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$MONITOR_DIR/backup-monitor-$TIMESTAMP.log"

# Default values
CHECK_ALL=false
ALERT_THRESHOLD=80  # Storage usage percentage
SEND_ALERTS=false
RETENTION_DAYS=30

# Alert thresholds
CRITICAL_THRESHOLD=95
WARNING_THRESHOLD=80
MAX_BACKUP_AGE_HOURS=25  # Alert if backup is older than 25 hours

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --check-all)
      CHECK_ALL=true
      shift
      ;;
    --alert-threshold)
      ALERT_THRESHOLD="$2"
      shift 2
      ;;
    --send-alerts)
      SEND_ALERTS=true
      shift
      ;;
    --retention-days)
      RETENTION_DAYS="$2"
      shift 2
      ;;
    *)
      echo "Unknown option $1"
      echo "Usage: $0 [--check-all] [--alert-threshold N] [--send-alerts] [--retention-days N]"
      exit 1
      ;;
  esac
done

# Create monitoring directory
mkdir -p "$MONITOR_DIR"

# Function to log with timestamp
log() {
  local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$message" | tee -a "$LOG_FILE"
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Alert tracking
ALERTS=()
WARNINGS=()
INFO_MESSAGES=()

# Function to add alert
add_alert() {
  local level="$1"
  local message="$2"
  
  case "$level" in
    "CRITICAL")
      ALERTS+=("$message")
      log "${RED}🚨 CRITICAL: $message${NC}"
      ;;
    "WARNING")
      WARNINGS+=("$message")
      log "${YELLOW}⚠️  WARNING: $message${NC}"
      ;;
    "INFO")
      INFO_MESSAGES+=("$message")
      log "${BLUE}ℹ️  INFO: $message${NC}"
      ;;
  esac
}

# Function to check backup storage usage
check_storage_usage() {
  log "${BLUE}💾 Checking backup storage usage...${NC}"
  
  if [[ ! -d "$BACKUP_DIR" ]]; then
    add_alert "CRITICAL" "Backup directory does not exist: $BACKUP_DIR"
    return
  fi
  
  # Get disk usage for backup directory
  local usage_info=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5 " " $4 " " $2}')
  local usage_percent=$(echo "$usage_info" | cut -d' ' -f1 | sed 's/%//')
  local available_kb=$(echo "$usage_info" | cut -d' ' -f2)
  local total_kb=$(echo "$usage_info" | cut -d' ' -f3)
  
  # Convert to human readable
  local available_gb=$((available_kb / 1024 / 1024))
  local total_gb=$((total_kb / 1024 / 1024))
  
  log "Storage usage: ${usage_percent}% (${available_gb}GB available of ${total_gb}GB total)"
  
  # Check thresholds
  if [[ "$usage_percent" -ge "$CRITICAL_THRESHOLD" ]]; then
    add_alert "CRITICAL" "Backup storage usage critical: ${usage_percent}% (threshold: ${CRITICAL_THRESHOLD}%)"
  elif [[ "$usage_percent" -ge "$WARNING_THRESHOLD" ]]; then
    add_alert "WARNING" "Backup storage usage high: ${usage_percent}% (threshold: ${WARNING_THRESHOLD}%)"
  else
    add_alert "INFO" "Backup storage usage normal: ${usage_percent}%"
  fi
  
  # Check available space
  if [[ "$available_gb" -lt 5 ]]; then
    add_alert "CRITICAL" "Low available storage: ${available_gb}GB remaining"
  elif [[ "$available_gb" -lt 10 ]]; then
    add_alert "WARNING" "Available storage getting low: ${available_gb}GB remaining"
  fi
}

# Function to check backup freshness
check_backup_freshness() {
  log "${BLUE}🕐 Checking backup freshness...${NC}"
  
  local environments=("dev" "prod")
  
  for env in "${environments[@]}"; do
    # Check database backups
    local latest_db_backup=$(find "$BACKUP_DIR" -name "wellflow-full-$env-*.dump" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -n "$latest_db_backup" ]]; then
      local backup_age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest_db_backup")) / 3600 ))
      
      if [[ "$backup_age_hours" -gt "$MAX_BACKUP_AGE_HOURS" ]]; then
        add_alert "WARNING" "Database backup for $env is ${backup_age_hours} hours old (threshold: ${MAX_BACKUP_AGE_HOURS}h)"
      else
        add_alert "INFO" "Database backup for $env is ${backup_age_hours} hours old"
      fi
    else
      add_alert "CRITICAL" "No database backup found for environment: $env"
    fi
    
    # Check Redis backups
    local latest_redis_backup=$(find "$BACKUP_DIR/redis" -name "redis-*-$env-*.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -n "$latest_redis_backup" ]]; then
      local backup_age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest_redis_backup")) / 3600 ))
      
      if [[ "$backup_age_hours" -gt "$MAX_BACKUP_AGE_HOURS" ]]; then
        add_alert "WARNING" "Redis backup for $env is ${backup_age_hours} hours old (threshold: ${MAX_BACKUP_AGE_HOURS}h)"
      else
        add_alert "INFO" "Redis backup for $env is ${backup_age_hours} hours old"
      fi
    else
      add_alert "WARNING" "No Redis backup found for environment: $env"
    fi
    
    # Check application backups
    local latest_app_backup=$(find "$BACKUP_DIR/application" -name "wellflow-app-$env-*.tar.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [[ -n "$latest_app_backup" ]]; then
      local backup_age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest_app_backup")) / 3600 ))
      
      if [[ "$backup_age_hours" -gt "$MAX_BACKUP_AGE_HOURS" ]]; then
        add_alert "WARNING" "Application backup for $env is ${backup_age_hours} hours old (threshold: ${MAX_BACKUP_AGE_HOURS}h)"
      else
        add_alert "INFO" "Application backup for $env is ${backup_age_hours} hours old"
      fi
    else
      add_alert "WARNING" "No application backup found for environment: $env"
    fi
  done
}

# Function to check backup integrity
check_backup_integrity() {
  log "${BLUE}🔍 Checking backup integrity...${NC}"
  
  # Check for corrupted files
  local corrupted_files=0
  
  # Check database backups
  find "$BACKUP_DIR" -name "*.dump" -type f | while read -r backup_file; do
    if ! pg_restore --list "$backup_file" > /dev/null 2>&1; then
      add_alert "CRITICAL" "Corrupted database backup detected: $(basename "$backup_file")"
      corrupted_files=$((corrupted_files + 1))
    fi
  done
  
  # Check compressed files
  find "$BACKUP_DIR" -name "*.gz" -type f | while read -r backup_file; do
    if ! gzip -t "$backup_file" 2>/dev/null; then
      add_alert "CRITICAL" "Corrupted compressed backup detected: $(basename "$backup_file")"
      corrupted_files=$((corrupted_files + 1))
    fi
  done
  
  # Check tar files
  find "$BACKUP_DIR" -name "*.tar.gz" -type f | while read -r backup_file; do
    if ! tar -tzf "$backup_file" > /dev/null 2>&1; then
      add_alert "CRITICAL" "Corrupted tar backup detected: $(basename "$backup_file")"
      corrupted_files=$((corrupted_files + 1))
    fi
  done
  
  if [[ "$corrupted_files" -eq 0 ]]; then
    add_alert "INFO" "All backup files passed integrity checks"
  fi
}

# Function to check backup retention compliance
check_retention_compliance() {
  log "${BLUE}📅 Checking backup retention compliance...${NC}"
  
  # Check for old backups that should be cleaned up
  local old_db_backups=$(find "$BACKUP_DIR" -name "wellflow-full-*.dump" -type f -mtime +$RETENTION_DAYS | wc -l)
  local old_redis_backups=$(find "$BACKUP_DIR/redis" -name "redis-*.gz" -type f -mtime +14 2>/dev/null | wc -l)
  local old_app_backups=$(find "$BACKUP_DIR/application" -name "wellflow-app-*.tar.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
  
  if [[ "$old_db_backups" -gt 0 ]]; then
    add_alert "WARNING" "$old_db_backups database backups exceed retention policy (${RETENTION_DAYS} days)"
  fi
  
  if [[ "$old_redis_backups" -gt 0 ]]; then
    add_alert "WARNING" "$old_redis_backups Redis backups exceed retention policy (14 days)"
  fi
  
  if [[ "$old_app_backups" -gt 0 ]]; then
    add_alert "WARNING" "$old_app_backups application backups exceed retention policy (${RETENTION_DAYS} days)"
  fi
  
  # Check backup counts
  local total_db_backups=$(find "$BACKUP_DIR" -name "wellflow-full-*.dump" -type f | wc -l)
  local total_redis_backups=$(find "$BACKUP_DIR/redis" -name "redis-*.gz" -type f 2>/dev/null | wc -l)
  local total_app_backups=$(find "$BACKUP_DIR/application" -name "wellflow-app-*.tar.gz" -type f 2>/dev/null | wc -l)
  
  add_alert "INFO" "Backup counts - Database: $total_db_backups, Redis: $total_redis_backups, Application: $total_app_backups"
}

# Function to check backup automation
check_backup_automation() {
  log "${BLUE}🤖 Checking backup automation...${NC}"
  
  # Check for recent backup logs
  local recent_logs=$(find "$PROJECT_ROOT/backups" -name "backup-*.log" -type f -mtime -1 2>/dev/null | wc -l)
  
  if [[ "$recent_logs" -eq 0 ]]; then
    add_alert "WARNING" "No recent backup logs found - automation may not be running"
  else
    add_alert "INFO" "Found $recent_logs recent backup log(s)"
  fi
  
  # Check cron jobs
  if crontab -l 2>/dev/null | grep -q "backup"; then
    add_alert "INFO" "Backup automation found in crontab"
  else
    add_alert "WARNING" "No backup automation found in crontab"
  fi
}

# Function to send alerts
send_alerts() {
  if [[ "$SEND_ALERTS" != true ]]; then
    return
  fi
  
  log "${BLUE}📧 Sending alerts...${NC}"
  
  local alert_count=${#ALERTS[@]}
  local warning_count=${#WARNINGS[@]}
  
  if [[ "$alert_count" -eq 0 && "$warning_count" -eq 0 ]]; then
    log "No alerts to send"
    return
  fi
  
  # Create alert payload
  local alert_payload="{
    \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"service\": \"wellflow-backup-monitor\",
    \"environment\": \"all\",
    \"alert_count\": $alert_count,
    \"warning_count\": $warning_count,
    \"alerts\": [$(printf '"%s",' "${ALERTS[@]}" | sed 's/,$//')]
    \"warnings\": [$(printf '"%s",' "${WARNINGS[@]}" | sed 's/,$//')]
  }"
  
  # Save alert for external processing
  echo "$alert_payload" >> "$MONITOR_DIR/backup-alerts-$(date +%Y%m%d).jsonl"
  
  # Send to Sentry if configured
  if [[ -n "$SENTRY_DSN" ]]; then
    curl -s -X POST "$SENTRY_DSN" \
      -H "Content-Type: application/json" \
      -d "$alert_payload" > /dev/null 2>&1 || true
  fi
  
  # Send email alerts (if configured)
  if [[ -n "$ALERT_EMAIL" ]]; then
    local subject="WellFlow Backup Alert - $alert_count Critical, $warning_count Warnings"
    local body="Backup monitoring detected issues:\n\nCritical Alerts:\n$(printf '- %s\n' "${ALERTS[@]}")\n\nWarnings:\n$(printf '- %s\n' "${WARNINGS[@]}")"
    
    echo -e "$body" | mail -s "$subject" "$ALERT_EMAIL" 2>/dev/null || true
  fi
  
  log "Alerts sent: $alert_count critical, $warning_count warnings"
}

# Function to generate monitoring report
generate_monitoring_report() {
  local report_file="$MONITOR_DIR/backup-monitoring-report-$TIMESTAMP.json"
  
  log "${BLUE}📊 Generating monitoring report...${NC}"
  
  cat > "$report_file" << EOF
{
  "monitoring_session": {
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "check_type": "$([[ "$CHECK_ALL" == true ]] && echo "comprehensive" || echo "basic")",
    "alert_threshold": $ALERT_THRESHOLD,
    "retention_days": $RETENTION_DAYS
  },
  "summary": {
    "critical_alerts": ${#ALERTS[@]},
    "warnings": ${#WARNINGS[@]},
    "info_messages": ${#INFO_MESSAGES[@]},
    "overall_status": "$([[ ${#ALERTS[@]} -eq 0 ]] && echo "healthy" || echo "issues_detected")"
  },
  "alerts": [
$(printf '    "%s",\n' "${ALERTS[@]}" | sed 's/,$//')
  ],
  "warnings": [
$(printf '    "%s",\n' "${WARNINGS[@]}" | sed 's/,$//')
  ],
  "info_messages": [
$(printf '    "%s",\n' "${INFO_MESSAGES[@]}" | sed 's/,$//')
  ],
  "checks_performed": [
    "storage_usage",
    "backup_freshness",
    "$([[ "$CHECK_ALL" == true ]] && echo "backup_integrity," || echo "")"
    "$([[ "$CHECK_ALL" == true ]] && echo "retention_compliance," || echo "")"
    "$([[ "$CHECK_ALL" == true ]] && echo "backup_automation" || echo "")"
  ],
  "recommendations": [
$(if [[ ${#ALERTS[@]} -gt 0 ]]; then
  echo '    "Address critical alerts immediately",'
fi)
$(if [[ ${#WARNINGS[@]} -gt 0 ]]; then
  echo '    "Review and resolve warnings",'
fi)
    "Continue regular monitoring",
    "Test backup restore procedures monthly"
  ],
  "next_check": "$(date -d "+1 day" -u +"%Y-%m-%dT%H:%M:%SZ")",
  "log_file": "$LOG_FILE"
}
EOF

  log "${GREEN}✅ Monitoring report generated: $report_file${NC}"
}

# Main execution
main() {
  log "${BLUE}🚀 WellFlow Backup Monitoring Starting${NC}"
  log "========================================"
  log "Check All: $CHECK_ALL"
  log "Alert Threshold: $ALERT_THRESHOLD%"
  log "Send Alerts: $SEND_ALERTS"
  
  # Always perform basic checks
  check_storage_usage
  check_backup_freshness
  
  # Perform comprehensive checks if requested
  if [[ "$CHECK_ALL" == true ]]; then
    if command_exists pg_restore; then
      check_backup_integrity
    else
      log "${YELLOW}⚠️  pg_restore not available, skipping integrity checks${NC}"
    fi
    
    check_retention_compliance
    check_backup_automation
  fi
  
  # Send alerts if configured
  send_alerts
  
  # Generate monitoring report
  generate_monitoring_report
  
  # Final summary
  log "${BLUE}📋 Monitoring Summary${NC}"
  log "Critical Alerts: ${#ALERTS[@]}"
  log "Warnings: ${#WARNINGS[@]}"
  log "Info Messages: ${#INFO_MESSAGES[@]}"
  
  if [[ ${#ALERTS[@]} -eq 0 ]]; then
    log "${GREEN}🎉 No critical issues detected${NC}"
    exit 0
  else
    log "${RED}❌ Critical issues detected - immediate attention required${NC}"
    exit 1
  fi
}

# Handle script termination
trap 'log "${RED}❌ Backup monitoring interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"
