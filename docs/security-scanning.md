# WellFlow Security Vulnerability Scanning

## Overview

This document describes the automated security vulnerability scanning
implementation for the WellFlow oil & gas production monitoring platform. The
security scanning system is designed to meet critical infrastructure
requirements and industry compliance standards.

## Security Scanning Tools

### 1. NPM Audit

- **Purpose**: Scan Node.js dependencies for known vulnerabilities
- **Command**: `pnpm audit --audit-level moderate`
- **Frequency**: Every commit, daily automated scans
- **Thresholds**: Fails on moderate or higher vulnerabilities

### 2. License Compliance Scanning

- **Purpose**: Ensure all dependencies use approved licenses
- **Command**: `pnpm licenses list`
- **Approved Licenses**: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC
- **Blocked Licenses**: GPL, AGPL, LGPL (commercial restrictions)

### 3. Dependency Monitoring

- **Purpose**: Track outdated dependencies with security implications
- **Command**: `pnpm outdated`
- **Integration**: Automated dependency updates via Dependabot

### 4. Snyk Security Scanning (Optional)

- **Purpose**: Enhanced vulnerability database and container scanning
- **Setup**: Requires Snyk CLI and authentication token
- **Command**: `snyk test --severity-threshold=high`

## Usage

### Manual Scanning

```bash
# Run comprehensive security scan
./scripts/security-scan.sh --report

# Run security scan with automatic fixes
./scripts/security-scan.sh --fix --report

# Run CI-mode security scan
./scripts/security-scan.sh --ci
```

### Package-Level Scanning

```bash
# Root level security check
pnpm run security:check

# Application-specific scanning
cd apps/web && pnpm run security:audit
cd apps/api && pnpm run security:audit
```

## Automated Scanning

### GitHub Actions Integration

The security scanning workflow (`.github/workflows/security-scan.yml`) runs:

- **On every push** to main/develop branches
- **On every pull request**
- **Daily at 6 AM UTC** (scheduled scan)
- **Manual trigger** with optional vulnerability fixes

### Pre-commit Integration

Security scanning is integrated into the pre-commit hooks:

- Runs on staged files only
- Prevents commits with critical vulnerabilities
- Can be bypassed in emergency situations

## Security Thresholds

### Vulnerability Severity Levels

| Severity | Action     | Max Age | Description                    |
| -------- | ---------- | ------- | ------------------------------ |
| Critical | Fail Build | 0 days  | Must be fixed immediately      |
| High     | Warn       | 7 days  | Must be fixed within 7 days    |
| Moderate | Warn       | 30 days | Must be fixed within 30 days   |
| Low      | Info       | 90 days | Should be fixed within 90 days |

### Quality Gates

- **Critical vulnerabilities**: Block deployment
- **High vulnerabilities**: Require security team approval
- **Moderate vulnerabilities**: Generate alerts and tracking tickets
- **Low vulnerabilities**: Included in regular maintenance cycles

## Reports and Artifacts

### Generated Reports

1. **npm-audit.json**: Detailed vulnerability data in JSON format
2. **npm-audit.txt**: Human-readable vulnerability report
3. **licenses.json**: License compliance report
4. **outdated.json**: Outdated dependencies report
5. **security-summary.md**: Executive summary report

### Report Storage

- **Local Development**: `security-reports/` directory (gitignored)
- **CI/CD**: GitHub Actions artifacts (90-day retention)
- **Production**: Secure artifact storage with audit trail

## Compliance and Standards

### Industry Standards

- **NIST Cybersecurity Framework**: Risk assessment and management
- **IEC 62443**: Industrial cybersecurity standards
- **API 1164**: Pipeline SCADA security guidelines

### Audit Requirements

- All security scans are logged with timestamps
- Vulnerability remediation is tracked and documented
- Regular security reports are generated for compliance officers
- Emergency bypass procedures are documented and audited

## Emergency Procedures

### Critical Vulnerability Response

1. **Immediate Assessment**: Evaluate exploitability and impact
2. **Risk Mitigation**: Implement temporary protective measures
3. **Patch Deployment**: Apply security patches with expedited testing
4. **Verification**: Confirm vulnerability remediation
5. **Documentation**: Record all actions in security incident log

### Bypass Procedures

In emergency situations where security gates must be bypassed:

1. **Authorization**: Requires security team approval
2. **Documentation**: Must document justification and timeline
3. **Tracking**: Create immediate remediation ticket
4. **Follow-up**: Schedule emergency security review

## Configuration Files

- **security-config.json**: Main security scanning configuration
- **.npmrc**: NPM security settings and audit configuration
- **.security-ignore**: Approved vulnerability exceptions
- **package.json**: Security scanning scripts and commands

## Monitoring and Alerting

### Alert Channels

- **Critical**: Email, Slack, Sentry (immediate)
- **High**: Email, Slack (daily digest)
- **Moderate**: Email (weekly digest)

### Integration with Existing Monitoring

- **Sentry**: Security scan failures are reported as errors
- **LogRocket**: Security events are tracked in session recordings
- **GitHub**: Security advisories are automatically created

## Best Practices

### Development Workflow

1. Run security scans before committing code
2. Review security reports in pull requests
3. Address vulnerabilities before merging to main
4. Keep dependencies updated with security patches

### Dependency Management

1. Use exact versions for production dependencies
2. Regularly update dependencies with security patches
3. Review new dependencies for security implications
4. Monitor dependency licenses for compliance

### Incident Response

1. Maintain updated security contact information
2. Document all security incidents and responses
3. Conduct post-incident reviews and improvements
4. Share security learnings across development teams

## Support and Contact

For questions about security scanning:

- **Security Team**: security@wellflow.com
- **DevOps Team**: devops@wellflow.com
- **Emergency Contact**: security-emergency@wellflow.com

## References

- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [IEC 62443 Standards](https://www.iec.ch/cyber-security)
- [API 1164 Pipeline Security](https://www.api.org/products-and-services/standards)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NPM Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
