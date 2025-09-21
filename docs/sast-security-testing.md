# WellFlow SAST (Static Application Security Testing)

## Overview

This document describes the Static Application Security Testing (SAST)
implementation for the WellFlow oil & gas production monitoring platform. SAST
tools analyze source code to identify security vulnerabilities without executing
the application, providing early detection of security issues in the development
lifecycle.

## SAST Tools Implementation

### 1. CodeQL Analysis

- **Tool**: GitHub CodeQL (Microsoft/GitHub)
- **Language Support**: JavaScript, TypeScript, Node.js
- **Coverage**: Comprehensive security analysis with GitHub native integration
- **Frequency**: Every push, PR, and weekly scheduled scans
- **Configuration**: `.github/codeql/codeql-config.yml`

### 2. Semgrep Security Scanning

- **Tool**: Semgrep (r2c/Semgrep)
- **Language Support**: JavaScript, TypeScript, React, Node.js, Express
- **Coverage**: OWASP Top 10, custom security patterns
- **Frequency**: Every push, PR, and daily scheduled scans
- **Configuration**: `.semgrep.yml`

## OWASP Top 10 2021 Coverage

### A01: Broken Access Control

- **Detection**: Missing authentication middleware, authorization bypasses
- **Patterns**: Unprotected API endpoints, privilege escalation
- **Tools**: CodeQL, Semgrep custom rules

### A02: Cryptographic Failures

- **Detection**: Weak encryption, hardcoded secrets, insecure random numbers
- **Patterns**: Hardcoded API keys, weak crypto algorithms
- **Tools**: CodeQL crypto queries, Semgrep secrets detection

### A03: Injection

- **Detection**: SQL injection, NoSQL injection, command injection, XSS
- **Patterns**: Unsanitized user input, dynamic query construction
- **Tools**: CodeQL injection queries, Semgrep OWASP rules

### A05: Security Misconfiguration

- **Detection**: Default configurations, exposed debug endpoints
- **Patterns**: Insecure defaults, unnecessary features enabled
- **Tools**: Semgrep configuration rules

### A07: Identification and Authentication Failures

- **Detection**: Weak session management, authentication bypasses
- **Patterns**: Session fixation, weak password policies
- **Tools**: CodeQL authentication queries

### A08: Software and Data Integrity Failures

- **Detection**: Insecure deserialization, untrusted data processing
- **Patterns**: Unsafe object deserialization, CI/CD pipeline issues
- **Tools**: CodeQL integrity queries

### A09: Security Logging and Monitoring Failures

- **Detection**: Insufficient logging, log injection, sensitive data in logs
- **Patterns**: Missing audit logs, logging sensitive information
- **Tools**: Semgrep logging rules

### A10: Server-Side Request Forgery (SSRF)

- **Detection**: Unvalidated URL requests, internal service access
- **Patterns**: User-controlled URLs, internal network requests
- **Tools**: CodeQL SSRF queries, Semgrep SSRF rules

## Usage

### Manual SAST Scanning

```bash
# Run comprehensive SAST scan
pnpm run sast:scan

# Run Semgrep only
pnpm run sast:semgrep

# Generate SARIF report for security tools
pnpm run sast:semgrep:sarif
```

### Automated SAST Scanning

#### GitHub Actions Integration

1. **CodeQL Analysis** (`.github/workflows/codeql-analysis.yml`)
   - Runs on push, PR, and weekly schedule
   - Comprehensive security analysis
   - SARIF upload to GitHub Security tab

2. **Semgrep SAST** (`.github/workflows/semgrep-sast.yml`)
   - Runs on push, PR, and daily schedule
   - Fast OWASP Top 10 scanning
   - Custom oil & gas security patterns

### CI/CD Integration

- **Quality Gates**: Critical findings block deployment
- **PR Checks**: Security analysis results in PR comments
- **Security Tab**: All findings available in GitHub Security
- **Artifacts**: Reports stored for 90 days

## Security Findings Management

### Severity Levels

| Severity             | Action           | Description                                                 |
| -------------------- | ---------------- | ----------------------------------------------------------- |
| **Critical (ERROR)** | Block deployment | Authentication bypasses, injection flaws, hardcoded secrets |
| **Warning**          | Review required  | Missing security controls, potential vulnerabilities        |
| **Info**             | Best practice    | Code quality issues with security implications              |

### False Positive Management

1. **Review Process**: Security team reviews all findings
2. **Suppression**: Use tool-specific suppression comments
3. **Documentation**: Document all suppressed findings
4. **Regular Review**: Quarterly review of suppressed items

### Remediation Workflow

1. **Triage**: Classify findings by severity and exploitability
2. **Assignment**: Assign to appropriate development team
3. **Fix**: Implement security fixes with testing
4. **Verification**: Re-scan to confirm remediation
5. **Documentation**: Update security documentation

## Configuration Files

### CodeQL Configuration (`.github/codeql/codeql-config.yml`)

- Custom query packs for security analysis
- Path inclusion/exclusion rules
- Oil & gas specific security patterns
- Compliance mapping to industry standards

### Semgrep Configuration (`.semgrep.yml`)

- OWASP Top 10 rule sets
- Custom rules for Node.js, React, NestJS
- Industry-specific security patterns
- Performance and output settings

## Compliance and Standards

### Industry Standards Alignment

#### NIST Cybersecurity Framework

- **PR.AC**: Identity Management and Access Control
- **PR.DS**: Data Security
- **PR.PT**: Protective Technology
- **DE.CM**: Security Continuous Monitoring

#### IEC 62443 (Industrial Cybersecurity)

- **SR 1.1**: Human user identification and authentication
- **SR 1.2**: Software process and device identification
- **SR 2.1**: Authorization enforcement
- **SR 3.1**: Communication integrity

#### API 1164 (Pipeline SCADA Security)

- Access Control and Authentication
- Data Integrity and Confidentiality
- Network Security
- Incident Response and Recovery

### Audit and Reporting

- **Security Reports**: Generated for each scan with compliance mapping
- **Executive Summaries**: High-level security posture reports
- **Trend Analysis**: Security improvement tracking over time
- **Compliance Reports**: Quarterly compliance status reports

## Integration with Development Workflow

### Pre-commit Integration

- Optional SAST scanning in pre-commit hooks
- Fast Semgrep rules for immediate feedback
- Configurable severity thresholds

### IDE Integration

- Semgrep VS Code extension for real-time analysis
- CodeQL CLI for local development scanning
- Security linting integration with ESLint

### Developer Training

- Security coding guidelines
- OWASP Top 10 awareness training
- Tool-specific training for developers
- Regular security workshops

## Performance Considerations

### Scan Performance

- **CodeQL**: Comprehensive but slower (weekly/PR only)
- **Semgrep**: Fast scanning for daily/commit checks
- **Parallel Execution**: Multiple tools run in parallel
- **Incremental Scanning**: Focus on changed files when possible

### Resource Usage

- **Memory**: 4GB limit for large codebases
- **Timeout**: 2 hours for comprehensive scans
- **Caching**: Dependency caching for faster CI runs
- **Artifacts**: 90-day retention for security reports

## Troubleshooting

### Common Issues

1. **False Positives**: Use suppression comments and review process
2. **Performance**: Adjust timeout and memory limits
3. **Configuration**: Validate YAML syntax and rule sets
4. **Integration**: Check GitHub permissions and secrets

### Support Contacts

- **Security Team**: security@wellflow.com
- **DevOps Team**: devops@wellflow.com
- **Tool Support**: GitHub Support, Semgrep Community

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Semgrep Rules](https://semgrep.dev/explore)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [IEC 62443 Standards](https://www.iec.ch/cyber-security)
