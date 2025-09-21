# GitHub Branch Protection & Quality Gates Configuration

## Overview

This document outlines the branch protection rules and quality gates
configuration for WellFlow's oil & gas production monitoring platform. These
rules ensure code quality, security, and compliance with industry standards
before code reaches production.

## Branch Protection Rules

### Main Branch Protection

Configure the following branch protection rules for the `main` branch:

#### Required Status Checks

- ✅ **Code Quality & Standards** - Must pass
- ✅ **Security Scanning** - Must pass
- ✅ **Test Coverage Analysis** - Must pass
- ✅ **Performance & Accessibility** - Must pass
- ✅ **Integration & E2E Tests** - Must pass
- ✅ **Quality Gate Summary** - Must pass

#### Additional Protection Settings

- ✅ **Require branches to be up to date before merging**
- ✅ **Require pull request reviews before merging** (minimum 1 reviewer)
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require review from code owners** (if CODEOWNERS file exists)
- ✅ **Restrict pushes that create files larger than 100MB**
- ✅ **Require signed commits** (recommended for compliance)
- ❌ **Allow force pushes** (disabled for security)
- ❌ **Allow deletions** (disabled for audit trail)

### Develop Branch Protection

Configure similar rules for the `develop` branch with slightly relaxed
requirements:

#### Required Status Checks

- ✅ **Code Quality & Standards** - Must pass
- ✅ **Security Scanning** - Must pass
- ✅ **Test Coverage Analysis** - Must pass
- ⚠️ **Performance & Accessibility** - Can be skipped with admin override
- ⚠️ **Integration & E2E Tests** - Can be skipped with admin override

## Quality Gates Configuration

### Gate 1: Code Quality & Standards

**Purpose**: Ensure consistent code formatting, linting, and type safety

**Checks**:

- Prettier code formatting compliance
- ESLint security and quality rules (1,177+ rules)
- TypeScript strict mode compilation
- Build integrity verification

**Failure Conditions**:

- Any formatting violations
- ESLint errors (warnings allowed)
- TypeScript compilation errors
- Build failures

### Gate 2: Security Scanning

**Purpose**: Detect security vulnerabilities and prevent credential exposure

**Checks**:

- NPM audit for dependency vulnerabilities
- License compliance scanning
- Secrets detection (GitLeaks, TruffleHog)
- SAST analysis (CodeQL, Semgrep)

**Failure Conditions**:

- Critical or high severity vulnerabilities
- Blocked licenses detected
- Secrets or credentials found in code
- OWASP Top 10 violations

### Gate 3: Test Coverage

**Purpose**: Ensure comprehensive test coverage meets 80% minimum requirement

**Checks**:

- Unit test execution
- Integration test execution
- Coverage threshold validation (80% minimum)
- Test result reporting

**Failure Conditions**:

- Any test failures
- Coverage below 80% threshold
- Missing critical test scenarios

### Gate 4: Performance & Accessibility

**Purpose**: Ensure application meets performance and accessibility standards

**Checks**:

- Performance budget validation
- Lighthouse performance scores
- WCAG 2.1 AA accessibility compliance
- Bundle size analysis

**Failure Conditions**:

- Performance budget exceeded
- Accessibility violations
- Critical performance regressions

### Gate 5: Integration & E2E Tests

**Purpose**: Validate end-to-end functionality and system integration

**Checks**:

- API integration tests
- Database integration tests
- End-to-end user workflows
- Cross-browser compatibility

**Failure Conditions**:

- Integration test failures
- E2E test failures
- Critical user workflow breaks

## Compliance & Audit Requirements

### Industry Standards Compliance

- **NIST Cybersecurity Framework**: Security controls and risk management
- **IEC 62443**: Industrial cybersecurity for oil & gas operations
- **API 1164**: Pipeline SCADA security standards
- **WCAG 2.1 AA**: Accessibility compliance for regulatory requirements

### Audit Trail Requirements

- All commits must be signed (GPG signatures recommended)
- Pull request reviews must be documented
- Quality gate results must be archived (90 days minimum)
- Security scan results must be retained (7 years for compliance)

## Emergency Procedures

### Hotfix Process

For critical production issues requiring immediate deployment:

1. Create hotfix branch from `main`
2. Implement minimal fix with comprehensive tests
3. Run abbreviated quality gates (security + tests only)
4. Require 2 reviewer approvals instead of 1
5. Deploy with enhanced monitoring
6. Follow up with full quality gate validation

### Quality Gate Override

Admin users can override quality gates in exceptional circumstances:

**Override Conditions**:

- Critical security patches
- Regulatory compliance deadlines
- Production outages affecting safety

**Override Requirements**:

- Written justification in PR description
- Security team approval for security-related overrides
- Follow-up issue to address quality gate failures
- Enhanced post-deployment monitoring

## Implementation Steps

### 1. Configure Branch Protection Rules

```bash
# Using GitHub CLI
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Code Quality & Standards","Security Scanning","Test Coverage Analysis","Performance & Accessibility","Integration & E2E Tests","Quality Gate Summary"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null
```

### 2. Create CODEOWNERS File

```
# WellFlow Code Owners
# Global ownership
* @wellflow-team/core-maintainers

# API and backend
/apps/api/ @wellflow-team/backend-team
/packages/database/ @wellflow-team/backend-team

# Frontend and UI
/apps/web/ @wellflow-team/frontend-team
/packages/ui/ @wellflow-team/frontend-team

# Security and compliance
/.github/workflows/ @wellflow-team/security-team
/security-config.json @wellflow-team/security-team
/.gitleaks.toml @wellflow-team/security-team

# Documentation
/docs/ @wellflow-team/documentation-team
README.md @wellflow-team/documentation-team
```

### 3. Configure Notifications

Set up notifications for quality gate failures:

- Slack integration for immediate alerts
- Email notifications for security issues
- Dashboard updates for compliance tracking

## Monitoring & Metrics

### Quality Gate Metrics

- **Pass Rate**: Percentage of PRs passing all quality gates
- **Time to Green**: Average time from PR creation to all gates passing
- **Failure Categories**: Most common quality gate failures
- **Coverage Trends**: Test coverage trends over time

### Security Metrics

- **Vulnerability Detection**: Number of vulnerabilities caught
- **Secret Detection**: Number of secrets prevented from commit
- **SAST Findings**: Static analysis security findings
- **Compliance Score**: Overall compliance with industry standards

### Performance Metrics

- **Build Time**: CI/CD pipeline execution time
- **Test Execution Time**: Time to run full test suite
- **Deployment Frequency**: How often code is deployed
- **Lead Time**: Time from commit to production

## Troubleshooting

### Common Quality Gate Failures

**Code Quality Failures**:

- Run `pnpm run format` to fix formatting issues
- Run `pnpm run lint:fix` to auto-fix linting issues
- Check TypeScript errors with `pnpm run check-types`

**Security Failures**:

- Review security scan reports in workflow artifacts
- Update dependencies with `pnpm update`
- Remove any detected secrets and rotate credentials

**Coverage Failures**:

- Add tests for uncovered code paths
- Review coverage report at `coverage/html-report/index.html`
- Focus on critical business logic and edge cases

**Performance Failures**:

- Analyze bundle size with `pnpm run analyze`
- Optimize images and assets
- Review and optimize database queries

## Best Practices

### For Developers

1. Run quality checks locally before pushing
2. Keep PRs small and focused
3. Write comprehensive tests for new features
4. Follow security best practices
5. Document complex business logic

### For Reviewers

1. Verify quality gate status before approving
2. Review security implications of changes
3. Ensure adequate test coverage
4. Check for compliance with coding standards
5. Validate business logic correctness

### For Maintainers

1. Monitor quality gate metrics regularly
2. Update quality thresholds as needed
3. Review and update security configurations
4. Ensure compliance with industry standards
5. Maintain documentation and procedures

This configuration ensures WellFlow maintains enterprise-grade code quality,
security, and compliance standards required for critical oil & gas
infrastructure operations.
