# WellFlow Operational Runbooks

**Last Updated**: September 2025  
**Status**: Comprehensive Operations Guide  
**Coverage**: Complete Infrastructure & Operations

This document consolidates all operational procedures, deployment guides,
monitoring setups, and maintenance protocols for WellFlow's oil & gas production
monitoring platform.

## Quick Reference

### Emergency Contacts

- **Primary On-Call**: +1-XXX-XXX-XXXX
- **Security Team**: <security@wellflow.com>
- **DevOps Team**: <devops@wellflow.com>
- **Emergency Hotline**: +1-XXX-XXX-XXXX

### Critical Commands

```bash
# Emergency backup
./scripts/secure-backup.sh --environment prod --encrypt

# Emergency restore
pg_restore --host=$DB_HOST --clean backup.dump

# Security incident response
./scripts/security-incident.sh --severity critical

# Performance monitoring
pnpm run performance:analyze --budget
```

## Deployment Procedures

### Railway Deployment

#### Initial Setup

```bash
# Login to Railway
railway login

# Initialize project
railway init
cd apps/api && railway link

# Add services
railway add postgresql
railway add redis
```

#### Environment Configuration

```env
# Database configuration
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Application settings
NODE_ENV=production
PORT=3001
JWT_SECRET=your-production-jwt-secret
CORS_ORIGINS=https://your-frontend-domain.vercel.app

# External services
SENTRY_DSN=your-sentry-dsn
RESEND_API_KEY=your-resend-api-key
TWILIO_ACCOUNT_SID=your-twilio-sid
```

#### Deployment Process

```bash
# Deploy application
railway up

# Monitor deployment
railway logs
railway status

# Health check verification
curl https://your-service.railway.app/health
```

### Quality Gates & Branch Protection

#### Branch Protection Rules

- **Required Status Checks**: Security, Quality, Performance, Tests
- **Review Requirements**: Minimum 1 reviewer, dismiss stale reviews
- **Admin Enforcement**: No force pushes, require signed commits
- **Merge Restrictions**: Up-to-date branches required

#### Quality Gate Thresholds

- **Test Coverage**: 80% minimum
- **Bundle Size**: 600KB maximum
- **API Response**: <500ms for critical endpoints
- **Security**: Zero critical vulnerabilities
- **Accessibility**: WCAG 2.1 AA compliance

## Monitoring & Alerting

### Error Tracking & Session Recording

#### Sentry Configuration

```typescript
// API monitoring
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});

// Web monitoring with session replay
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### LogRocket Configuration

```typescript
LogRocket.init('your-app-id', {
  console: { shouldAggregateConsoleErrors: true },
  dom: { textSanitizer: true, inputSanitizer: true },
});
```

### Performance Monitoring

#### Performance Budgets

| Asset Type | Budget | Purpose                           |
| ---------- | ------ | --------------------------------- |
| JavaScript | 500KB  | Interactive monitoring interfaces |
| CSS        | 100KB  | Responsive field operations       |
| Images     | 200KB  | Equipment status indicators       |
| Total Load | 600KB  | Emergency response readiness      |

#### Core Web Vitals Targets

- **LCP**: <2.5s (Good), 2.5s-4.0s (Needs Improvement), >4.0s (Poor)
- **FID**: <100ms (Good), 100ms-300ms (Needs Improvement), >300ms (Poor)
- **CLS**: <0.1 (Good), 0.1-0.25 (Needs Improvement), >0.25 (Poor)

### Queue System Monitoring

#### Queue Dashboard

- **Access**: `http://localhost:3003/?token=<JWT_TOKEN>`
- **Features**: Real-time job monitoring, queue status, job inspection
- **Authentication**: JWT-based with role-based access

#### Job Types & Priorities

- **Data Validation**: Production data integrity checks
- **Report Generation**: Regulatory and operational reports
- **Email Notifications**: Critical alerts and compliance reminders

## Security Operations

### Security Scanning Framework

#### Comprehensive Security Testing

```bash
# Complete security suite
pnpm run security:all

# Individual components
pnpm run security:api          # OWASP API Top 10
pnpm run security:sast         # Static analysis
pnpm run security:secrets      # Credential scanning
pnpm run security:infrastructure # Container & IaC scanning
```

#### OWASP API Security Top 10 Compliance

| Risk  | Description                         | WellFlow Status |
| ----- | ----------------------------------- | --------------- |
| API1  | Broken Object Level Authorization   | ✅ COMPLIANT    |
| API2  | Broken User Authentication          | ✅ COMPLIANT    |
| API3  | Excessive Data Exposure             | ✅ COMPLIANT    |
| API4  | Lack of Resources & Rate Limiting   | ✅ COMPLIANT    |
| API5  | Broken Function Level Authorization | ✅ COMPLIANT    |
| API6  | Mass Assignment                     | ✅ COMPLIANT    |
| API7  | Security Misconfiguration           | ✅ COMPLIANT    |
| API8  | Injection                           | ✅ COMPLIANT    |
| API9  | Improper Assets Management          | ✅ COMPLIANT    |
| API10 | Insufficient Logging & Monitoring   | ✅ COMPLIANT    |

### Secrets Management

#### Secrets Detection

```bash
# Run comprehensive secrets scan
pnpm run secrets:check

# GitLeaks scanning
gitleaks detect --config=.gitleaks.toml --source=./apps/api

# Historical scanning
gitleaks detect --log-opts="--since=2024-01-01"
```

#### Secret Storage Solutions

- **Development**: `.env.local` files (gitignored)
- **Production**: Railway environment variables
- **CI/CD**: GitHub Secrets with environment protection

### Incident Response

#### Security Incident Classification

- **CRITICAL (P0)**: Active exploits, data breaches, SCADA compromise
- **HIGH (P1)**: Significant vulnerabilities, failed security gates
- **MEDIUM (P2)**: Security concerns, quality gate warnings
- **LOW (P3)**: Minor improvements, documentation updates

#### Response Procedures

1. **Immediate Assessment** (0-15 minutes): Acknowledge alert, assess severity
2. **Notification & Escalation** (15-30 minutes): Alert appropriate teams
3. **Investigation** (30 minutes - 2 hours): Collect evidence, analyze root
   cause
4. **Containment** (Immediate): Isolate affected systems, apply emergency
   patches
5. **Resolution** (2-24 hours): Implement permanent fix, validate effectiveness
6. **Post-Incident** (24-72 hours): Document lessons learned, improve processes

## Backup & Recovery

### Backup Components

- **Database**: Daily PostgreSQL/TimescaleDB backups
- **Redis**: Daily cache backups
- **Application**: Daily code and configuration backups
- **Encryption**: AES256 for production backups

### Recovery Procedures

#### Database Recovery

```bash
# Assess situation
pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Stop services
railway service stop api

# Restore database
LATEST_BACKUP=$(ls -t /backups/wellflow-full-prod-*.dump | head -1)
pg_restore --host=$DB_HOST --clean --verbose "$LATEST_BACKUP"

# Validate recovery
psql -h $DB_HOST -c "SELECT COUNT(*) FROM wells;"

# Restart services
railway service start api
```

#### Application Recovery

```bash
# Deploy from repository
git clone https://github.com/appjitsu/wellflow.git
cd wellflow && git checkout main
pnpm install && pnpm run build
railway up

# Validate health
curl -f https://api.wellflow.com/health
```

### Recovery Objectives

- **RTO (Recovery Time Objective)**: 4 hours maximum for critical systems
- **RPO (Recovery Point Objective)**: 1 hour maximum data loss

## External Service Integration

### Service Configuration

#### Sentry (Error Tracking)

```env
SENTRY_DSN_API=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=wellflow
SENTRY_PROJECT_API=wellflow-api
```

#### UploadThing (File Storage)

```env
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=your-app-id
```

#### Resend (Email Service)

```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Firebase (Push Notifications)

```env
FIREBASE_PROJECT_ID=wellflow-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@wellflow-xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="your-firebase-private-key-here"
```

#### Mapbox (GIS Services)

```env
MAPBOX_ACCESS_TOKEN=pk.xxx
MAPBOX_SECRET_TOKEN=sk.xxx
```

#### Twilio (SMS Notifications)

```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
```

## Job Processing System

### Queue Types & Configuration

- **data-validation**: Production data integrity and compliance
- **report-generation**: Regulatory and operational reports
- **email-notifications**: Critical alerts and communications

### Job Processors

#### Data Validation

- Production data validation (0-10,000 bbl/day oil, 0-50,000 MCF/day gas)
- Geographic coordinate validation
- Regulatory compliance checks
- Environmental impact assessments

#### Report Generation

- Daily, monthly, quarterly production reports
- Compliance reports (EPA, RRC, OSHA)
- Safety and environmental reports
- Formats: PDF, Excel, CSV

#### Email Notifications

- Safety alerts (critical, high, medium, low)
- Compliance reminders
- Equipment maintenance alerts
- Report completion notifications

### Scheduled Jobs

- **Daily (2:00 AM CT)**: Production data validation
- **Daily (9:00 AM CT)**: Permit expiration checks
- **Weekly (Sunday 6:00 AM CT)**: Compliance reports
- **Monthly (1st, 8:00 AM CT)**: Production summaries

## Maintenance Procedures

### Regular Maintenance Schedule

#### Daily (Automated)

- 2:00 AM UTC: Database backup
- 3:00 AM UTC: Redis backup
- 4:00 AM UTC: Application backup
- 9:00 AM UTC: Backup monitoring check

#### Weekly (Manual)

- Friday: Comprehensive backup testing
- Sunday: Storage cleanup and optimization

#### Monthly (Manual)

- First Friday: Disaster recovery test
- Third Friday: Security review
- Last Friday: Documentation update

#### Quarterly (Manual)

- Encryption key rotation
- Backup procedure review
- Team training and drills

### Performance Optimization

#### Bundle Analysis

```bash
# Analyze bundle sizes
pnpm run performance:analyze

# Check budget compliance
pnpm run performance:budget

# Generate reports
pnpm run performance:report
```

#### Database Optimization

- Connection pooling with PgBouncer
- Read replicas for analytics
- TimescaleDB for production data
- Strategic indexing for critical queries

#### Caching Strategy

- Redis for session storage and frequently accessed data
- CDN for static assets (1 year cache)
- API response caching (5 minutes for dynamic data)

## Compliance & Audit

### Industry Standards

- **NIST Cybersecurity Framework**: Critical infrastructure guidelines
- **IEC 62443**: Industrial cybersecurity standards
- **API 1164**: Pipeline SCADA security requirements
- **WCAG 2.1 AA**: Accessibility compliance

### Audit Requirements

- **Retention**: 7-year retention for oil & gas compliance
- **Logging**: Complete audit trail of all operations
- **Security**: Regular penetration testing and vulnerability assessments
- **Documentation**: Quarterly reviews and updates

### Compliance Monitoring

- Real-time security event correlation
- Automated vulnerability scanning
- Performance and availability monitoring
- Regulatory reporting automation

## Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check logs
railway logs --service api

# Verify environment variables
railway variables

# Test connectivity
pg_isready -h $DB_HOST
redis-cli -h $REDIS_HOST ping
```

#### Performance Issues

```bash
# Check bundle sizes
pnpm run performance:analyze

# Monitor API response times
curl -w "@curl-format.txt" https://api.wellflow.com/health

# Database query analysis
EXPLAIN ANALYZE SELECT * FROM wells WHERE organization_id = 'xxx';
```

#### Security Issues

```bash
# Run security scans
pnpm run security:all

# Check for secrets
gitleaks detect --config=.gitleaks.toml

# Verify SSL/TLS
openssl s_client -connect api.wellflow.com:443
```

#### Queue Processing Issues

```bash
# Check queue status
curl http://localhost:3003/api/queues

# Monitor job processing
redis-cli -h $REDIS_HOST monitor

# Restart queue processors
railway restart queue-processor
```

## Best Practices

### Development Operations

- Run quality checks locally before pushing
- Use feature flags for gradual rollouts
- Implement comprehensive monitoring from day one
- Maintain separation between IT and OT systems

### Security Operations

- Rotate secrets quarterly
- Monitor for unusual access patterns
- Implement defense in depth
- Regular security training for all team members

### Performance Operations

- Monitor Core Web Vitals continuously
- Implement performance budgets
- Use CDN for global performance
- Optimize for mobile and low-bandwidth scenarios

### Incident Management

- Document all incidents thoroughly
- Conduct post-incident reviews
- Update procedures based on lessons learned
- Test incident response procedures regularly

This comprehensive operational guide ensures WellFlow maintains enterprise-grade
reliability, security, and performance for critical oil & gas infrastructure
operations.
