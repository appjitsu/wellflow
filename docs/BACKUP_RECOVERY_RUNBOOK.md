# WellFlow Backup and Recovery Runbook

## Overview

This runbook provides comprehensive procedures for backup and recovery
operations in the WellFlow oil & gas production monitoring platform. It covers
daily operations, emergency procedures, and troubleshooting guidance for all
backup components.

## Quick Reference

### Emergency Contacts

- **Primary On-Call**: +1-XXX-XXX-XXXX
- **Backup Administrator**: +1-XXX-XXX-XXXX
- **DevOps Team**: <devops@wellflow.com>
- **Security Team**: <security@wellflow.com>

### Critical Commands

```bash
# Emergency backup
./scripts/secure-backup.sh --environment prod --encrypt

# Emergency restore (database)
pg_restore --host=$DB_HOST --port=$DB_PORT --username=$DB_USER --dbname=$DB_NAME --clean backup.dump

# Check backup status
./scripts/backup-monitor.sh --check-all --send-alerts
```

## Backup Components

### 1. Database Backups (PostgreSQL/TimescaleDB)

- **Frequency**: Daily at 2:00 AM UTC
- **Retention**: 30 days
- **Location**: `/backups/` and Railway automated backups
- **Format**: Custom format (.dump) and SQL (.sql.gz)
- **Encryption**: AES256 (production)

### 2. Redis Cache Backups

- **Frequency**: Daily at 3:00 AM UTC
- **Retention**: 14 days
- **Location**: `/backups/redis/`
- **Format**: RDB files and command dumps (.gz)
- **Encryption**: AES256 (production)

### 3. Application Backups

- **Frequency**: Daily at 4:00 AM UTC
- **Retention**: 30 days
- **Location**: `/backups/application/`
- **Components**: Code, configurations, documentation, scripts
- **Format**: Compressed tar archives (.tar.gz)
- **Encryption**: AES256 (production)

## Daily Operations

### Morning Backup Verification (9:00 AM)

```bash
# Check backup status
./scripts/backup-monitor.sh --check-all

# Review overnight backup logs
tail -100 /backups/secure-backup-*.log

# Verify storage usage
df -h /backups
```

### Weekly Backup Testing (Fridays)

```bash
# Run comprehensive backup tests
./scripts/backup-test.sh --environment dev --restore-test

# Test backup integrity
./scripts/backup-test.sh --environment prod --type all --verify

# Review backup retention
find /backups -name "*.dump" -mtime +30 -ls
```

### Monthly Disaster Recovery Test

```bash
# Full restore test in development environment
./scripts/database-backup.sh --environment dev --verify
./scripts/backup-test.sh --environment dev --restore-test

# Document test results
echo "DR Test $(date): [PASS/FAIL] - [Notes]" >> /docs/dr-test-log.txt
```

## Backup Procedures

### Manual Database Backup

```bash
# Standard backup
./scripts/database-backup.sh --environment prod --type full --encrypt --verify

# Incremental backup (if supported)
./scripts/database-backup.sh --environment prod --type incremental --encrypt

# Emergency backup (fastest)
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -Fc > emergency-backup-$(date +%Y%m%d_%H%M%S).dump
```

### Manual Redis Backup

```bash
# Standard Redis backup
./scripts/redis-backup.sh --environment prod --encrypt --verify

# Quick Redis backup
redis-cli -h $REDIS_HOST -p $REDIS_PORT BGSAVE
```

### Manual Application Backup

```bash
# Full application backup
./scripts/application-backup.sh --environment prod --encrypt --verify

# Configuration-only backup
tar -czf config-backup-$(date +%Y%m%d_%H%M%S).tar.gz *.json *.yml *.yaml .env.example
```

### Secure Orchestrated Backup

```bash
# Complete secure backup with audit trail
./scripts/secure-backup.sh --environment prod --type full --encrypt

# Check backup status
./scripts/backup-monitor.sh --send-alerts
```

## Recovery Procedures

### Database Recovery

#### Step 1: Assess Situation

```bash
# Check database status
pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Check Railway service status
railway status

# Review error logs
railway logs --service postgres --lines 100
```

#### Step 2: Prepare for Recovery

```bash
# Stop application services
railway service stop api
railway service stop web

# Create backup of current state (if possible)
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -Fc > pre-recovery-backup-$(date +%Y%m%d_%H%M%S).dump
```

#### Step 3: Restore Database

```bash
# Find latest backup
LATEST_BACKUP=$(ls -t /backups/wellflow-full-prod-*.dump | head -1)
echo "Restoring from: $LATEST_BACKUP"

# Restore database
pg_restore \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --clean \
  --if-exists \
  --verbose \
  "$LATEST_BACKUP"
```

#### Step 4: Validate Recovery

```bash
# Test database connectivity
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();"

# Check critical tables
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
SELECT 'wells' as table_name, COUNT(*) as record_count FROM wells
UNION ALL
SELECT 'production_data', COUNT(*) FROM production_data
UNION ALL
SELECT 'users', COUNT(*) FROM users;
EOF

# Restart services
railway service start api
railway service start web

# Test application functionality
curl -f https://api.wellflow.com/health
```

### Redis Recovery

#### Step 1: Stop Redis-dependent Services

```bash
# Stop API services that use Redis
railway service stop api
```

#### Step 2: Restore Redis Data

```bash
# For RDB backup
redis-cli -h $REDIS_HOST -p $REDIS_PORT FLUSHALL
# Copy RDB file to Redis data directory (method varies by deployment)

# For command dump backup
LATEST_REDIS_BACKUP=$(ls -t /backups/redis/redis-dump-prod-*.txt.gz | head -1)
gunzip -c "$LATEST_REDIS_BACKUP" | redis-cli -h $REDIS_HOST -p $REDIS_PORT --pipe
```

#### Step 3: Validate Redis Recovery

```bash
# Test Redis connectivity
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping

# Check restored data
redis-cli -h $REDIS_HOST -p $REDIS_PORT info keyspace

# Restart dependent services
railway service start api
```

### Application Recovery

#### Step 1: Restore Application Files

```bash
# Find latest application backup
LATEST_APP_BACKUP=$(ls -t /backups/application/wellflow-app-prod-*.tar.gz | head -1)

# Extract to temporary location
mkdir -p /tmp/app-restore
tar -xzf "$LATEST_APP_BACKUP" -C /tmp/app-restore

# Deploy restored application
cd /tmp/app-restore
railway up
```

#### Step 2: Restore Configuration

```bash
# Find latest config backup
LATEST_CONFIG_BACKUP=$(ls -t /backups/application/wellflow-config-prod-*.tar.gz | head -1)

# Extract configuration
tar -xzf "$LATEST_CONFIG_BACKUP" -C /tmp/config-restore

# Restore environment variables (manual process)
# Review and set critical environment variables
railway variables set DB_HOST=$RESTORED_DB_HOST
railway variables set REDIS_URL=$RESTORED_REDIS_URL
```

## Troubleshooting

### Common Issues

#### Backup Script Fails

```bash
# Check disk space
df -h /backups

# Check permissions
ls -la /backups
ls -la scripts/

# Check database connectivity
pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Check logs
tail -50 /backups/backup-*.log
```

#### Backup Files Corrupted

```bash
# Test backup integrity
pg_restore --list /backups/wellflow-full-prod-*.dump
gzip -t /backups/redis/*.gz
tar -tzf /backups/application/*.tar.gz

# Find last known good backup
./scripts/backup-test.sh --environment prod --type all
```

#### Storage Space Issues

```bash
# Check storage usage
du -sh /backups/*

# Clean old backups
find /backups -name "*.dump" -mtime +30 -delete
find /backups -name "*.gz" -mtime +14 -delete

# Compress old backups
find /backups -name "*.sql" -mtime +7 -exec gzip {} \;
```

#### Encryption Key Issues

```bash
# Check if encryption key is set
echo $BACKUP_ENCRYPTION_KEY | wc -c

# Test decryption
gpg --decrypt /backups/encrypted-backup.gpg > /dev/null

# Regenerate encryption key (emergency only)
export BACKUP_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### Recovery Validation Checklist

#### Database Recovery Validation

- [ ] Database connection successful
- [ ] All expected tables present
- [ ] Record counts match expectations
- [ ] Recent data available (check timestamps)
- [ ] Application can connect to database
- [ ] Critical queries execute successfully

#### Redis Recovery Validation

- [ ] Redis connection successful
- [ ] Expected keys restored
- [ ] Cache functionality working
- [ ] Session data available
- [ ] Application performance normal

#### Application Recovery Validation

- [ ] All services deployed successfully
- [ ] API endpoints responding
- [ ] Web dashboard accessible
- [ ] Authentication working
- [ ] File uploads functional
- [ ] Background jobs processing

## Monitoring and Alerting

### Automated Monitoring

```bash
# Set up daily monitoring (add to crontab)
0 9 * * * /path/to/scripts/backup-monitor.sh --check-all --send-alerts

# Set up weekly comprehensive checks
0 10 * * 5 /path/to/scripts/backup-test.sh --environment prod --type all
```

### Alert Thresholds

- **Critical**: Backup failure, corruption detected, storage >95%
- **Warning**: Backup >25 hours old, storage >80%, integrity issues
- **Info**: Successful backups, normal operations

### Alert Destinations

- **Email**: <alerts@wellflow.com>
- **Sentry**: Configured via SENTRY_DSN
- **Logs**: /security-reports/backup-monitoring/

## Security Considerations

### Access Control

- Backup operations require `backup-operator`, `admin`, or `devops` role
- Production restores require dual approval
- All operations logged with audit trail

### Encryption

- All production backups encrypted with AES256
- Encryption keys rotated quarterly
- Keys stored securely, never in version control

### Compliance

- Audit trail retained for 7 years (2555 days)
- Backup procedures comply with NIST, IEC 62443, API 1164
- Regular security reviews and penetration testing

## Maintenance Schedule

### Daily (Automated)

- 2:00 AM UTC: Database backup
- 3:00 AM UTC: Redis backup
- 4:00 AM UTC: Application backup
- 9:00 AM UTC: Backup monitoring check

### Weekly (Manual)

- Friday: Comprehensive backup testing
- Sunday: Storage cleanup and optimization

### Monthly (Manual)

- First Friday: Disaster recovery test
- Third Friday: Security review
- Last Friday: Documentation update

### Quarterly (Manual)

- Encryption key rotation
- Backup procedure review
- Disaster recovery plan update
- Team training and drills

---

**Document Version**: 1.0  
**Last Updated**: $(date)  
**Next Review**: $(date -d "+3 months")  
**Owner**: DevOps Team  
**Approved By**: [Name], CTO

For questions or updates to this runbook, contact: <devops@wellflow.com>
