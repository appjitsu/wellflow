# WellFlow Secrets Management & Scanning

## Overview

This document describes the secrets management and scanning implementation for
the WellFlow oil & gas production monitoring platform. Proper secrets management
is critical for protecting sensitive credentials, API keys, and other
confidential information in critical infrastructure applications.

## Secrets Scanning Tools

### 1. GitLeaks

- **Purpose**: Detect secrets in Git repositories and commit history
- **Configuration**: `.gitleaks.toml`
- **Coverage**: API keys, database URLs, private keys, tokens
- **Frequency**: Every commit, PR, and daily scans

### 2. TruffleHog

- **Purpose**: Find secrets with high confidence using entropy analysis
- **Coverage**: Verified secrets from popular services
- **Integration**: GitHub Actions workflow
- **Features**: Historical scanning, verified findings only

### 3. Custom Pattern Scanning

- **Purpose**: Oil & gas industry specific secret patterns
- **Coverage**: SCADA credentials, pipeline APIs, production systems
- **Patterns**: Custom regex patterns for industrial systems
- **Integration**: Automated scanning in CI/CD pipeline

### 4. GitHub Secret Scanning

- **Purpose**: Native GitHub secret detection
- **Coverage**: Partner patterns, custom patterns
- **Integration**: Automatic alerts and PR blocking
- **Features**: Secret push protection, historical scanning

## Secret Types Detected

### Critical Infrastructure Secrets

- **SCADA System Credentials**: HMI passwords, SCADA API keys
- **Pipeline System Keys**: Production API keys, monitoring tokens
- **Industrial Control Systems**: PLC credentials, DCS access keys
- **Environmental Monitoring**: Sensor API keys, data collection tokens

### Application Secrets

- **Database Credentials**: PostgreSQL, MongoDB, Redis connection strings
- **Authentication Tokens**: JWT secrets, session keys, API tokens
- **Encryption Keys**: AES keys, RSA private keys, certificate keys
- **Service Credentials**: Third-party API keys, webhook secrets

### Cloud Provider Secrets

- **AWS**: Access keys, secret keys, session tokens
- **Azure**: Client secrets, tenant IDs, subscription keys
- **Google Cloud**: Service account keys, API keys, OAuth tokens
- **Railway/Vercel**: Deployment tokens, environment variables

### Third-Party Service Keys

- **Payment Processing**: Stripe secret keys, PayPal credentials
- **Communication**: SendGrid API keys, Twilio auth tokens
- **Monitoring**: Sentry DSN, LogRocket tokens, DataDog keys
- **Analytics**: Google Analytics, Mixpanel, Amplitude tokens

## Usage

### Manual Secrets Scanning

```bash
# Run comprehensive secrets scan
pnpm run secrets:check

# Run GitLeaks only
pnpm run secrets:gitleaks

# Scan specific directory
gitleaks detect --config=.gitleaks.toml --source=./apps/api

# Scan Git history
gitleaks detect --config=.gitleaks.toml --log-opts="--since=2024-01-01"
```

### Automated Secrets Scanning

#### GitHub Actions Integration

- **Workflow**: `.github/workflows/secrets-scanning.yml`
- **Triggers**: Push, PR, daily schedule, manual dispatch
- **Tools**: GitLeaks, TruffleHog, custom patterns
- **Reporting**: SARIF, JSON, markdown summaries

#### Pre-commit Integration

```bash
# Add to .husky/pre-commit
gitleaks protect --config=.gitleaks.toml --staged
```

## Secrets Management Best Practices

### Environment Variables

```typescript
// ✅ Good: Use environment variables
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;

// ❌ Bad: Hardcoded secrets
const apiKey = 'sk_live_abcd1234...';
const dbUrl = 'postgresql://user:pass@host/db';
```

### Configuration Management

```typescript
// ✅ Good: Configuration service
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getApiKey(): string {
    return this.configService.get<string>('API_KEY');
  }
}

// ❌ Bad: Direct environment access
const apiKey = process.env.API_KEY;
```

### Secret Rotation

```typescript
// ✅ Good: Support for secret rotation
class SecretManager {
  private secrets = new Map<string, string>();

  async rotateSecret(key: string): Promise<void> {
    const newSecret = await this.generateNewSecret();
    this.secrets.set(key, newSecret);
    await this.updateExternalSystems(key, newSecret);
  }
}
```

## Secret Storage Solutions

### Development Environment

- **Local**: `.env.local` files (gitignored)
- **Team**: Shared `.env.example` with placeholder values
- **Security**: Never commit actual secrets to version control

### Production Environment

- **Railway**: Environment variables in dashboard
- **Vercel**: Environment variables in project settings
- **Docker**: Secrets management with Docker Swarm/Kubernetes
- **Cloud**: AWS Secrets Manager, Azure Key Vault, GCP Secret Manager

### CI/CD Environment

- **GitHub Secrets**: Repository and organization secrets
- **Environment Protection**: Branch protection rules
- **Least Privilege**: Minimal required permissions
- **Audit Trail**: All secret access logged

## Incident Response

### Secret Exposure Response

1. **Immediate Actions**
   - Rotate exposed credentials immediately
   - Revoke compromised API keys
   - Update all affected systems
   - Monitor for unauthorized access

2. **Investigation**
   - Determine scope of exposure
   - Identify affected systems and data
   - Review access logs and audit trails
   - Document timeline and impact

3. **Remediation**
   - Implement additional security controls
   - Update secret management processes
   - Conduct security training
   - Review and update policies

4. **Follow-up**
   - Monitor for ongoing threats
   - Conduct post-incident review
   - Update incident response procedures
   - Share lessons learned

### Emergency Contacts

- **Security Team**: security@wellflow.com
- **DevOps Team**: devops@wellflow.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

## Compliance Requirements

### Industry Standards

- **NIST Cybersecurity Framework**: PR.AC-1, PR.DS-1, PR.DS-2
- **IEC 62443**: SR 1.1, SR 1.2, SR 2.1, SR 3.1
- **API 1164**: Access Control, Data Protection, Audit Requirements

### Audit Requirements

- **Secret Access Logging**: All secret access must be logged
- **Retention**: 7-year retention for oil & gas compliance
- **Regular Reviews**: Quarterly secret inventory and review
- **Documentation**: All secrets must be documented and classified

### Regulatory Compliance

- **Data Protection**: Encryption of secrets at rest and in transit
- **Access Control**: Role-based access to secrets
- **Audit Trail**: Complete audit trail of secret operations
- **Incident Reporting**: Mandatory reporting of secret exposures

## Configuration Files

### GitLeaks Configuration (`.gitleaks.toml`)

- Custom rules for oil & gas industry patterns
- Allowlisted files and patterns
- Performance and reporting settings
- Compliance and audit configuration

### GitHub Actions Workflow

- Multi-tool scanning approach
- Custom pattern detection
- SARIF report generation
- PR comment integration

## Monitoring and Alerting

### Real-time Monitoring

- **GitHub Push Protection**: Prevents secret commits
- **PR Checks**: Automated secret scanning on pull requests
- **Daily Scans**: Comprehensive repository scanning
- **Historical Analysis**: Full Git history scanning

### Alert Channels

- **Critical**: Immediate Slack/email alerts
- **High**: Daily digest reports
- **Medium**: Weekly summary reports
- **Audit**: Monthly compliance reports

## Tools and Resources

### Required Tools

- **GitLeaks**: `brew install gitleaks` or Docker
- **TruffleHog**: GitHub Actions integration
- **GitHub CLI**: `gh auth login` for secret management
- **Environment Managers**: direnv, dotenv

### Recommended Reading

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [NIST SP 800-57: Key Management](https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final)
- [GitHub Secret Scanning Documentation](https://docs.github.com/en/code-security/secret-scanning)

### Support Resources

- **Internal Wiki**: Confluence secrets management space
- **Training Materials**: Security awareness training modules
- **Runbooks**: Incident response procedures
- **Contact Directory**: Security team contact information
