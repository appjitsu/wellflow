#!/bin/bash

# WellFlow Security Scanning Script
# Comprehensive security vulnerability scanning for oil & gas production monitoring platform
# Usage: ./scripts/security-scan.sh [--fix] [--report] [--ci]

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
REPORTS_DIR="$PROJECT_ROOT/security-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Parse command line arguments
FIX_VULNERABILITIES=false
GENERATE_REPORT=false
CI_MODE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --fix)
      FIX_VULNERABILITIES=true
      shift
      ;;
    --report)
      GENERATE_REPORT=true
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Create reports directory
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}🔒 WellFlow Security Vulnerability Scanning${NC}"
echo -e "${BLUE}=============================================${NC}"
echo "Timestamp: $(date)"
echo "Project: $PROJECT_ROOT"
echo "Reports: $REPORTS_DIR"
echo ""

# Function to log with timestamp
log() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# 1. NPM Audit Scan
log "${BLUE}📦 Running NPM Audit Scan...${NC}"
cd "$PROJECT_ROOT"

if $GENERATE_REPORT; then
  pnpm audit --json > "$REPORTS_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || true
  pnpm audit > "$REPORTS_DIR/npm-audit-$TIMESTAMP.txt" 2>/dev/null || true
fi

if $FIX_VULNERABILITIES; then
  log "${YELLOW}🔧 Attempting to fix vulnerabilities...${NC}"
  pnpm audit --fix || true
fi

# Check audit results
AUDIT_RESULT=$(pnpm audit --audit-level moderate 2>&1 || echo "vulnerabilities found")
if [[ "$AUDIT_RESULT" == *"vulnerabilities found"* ]]; then
  log "${YELLOW}⚠️  Vulnerabilities detected in dependencies${NC}"
  if $CI_MODE; then
    echo "::warning::Security vulnerabilities found in dependencies"
  fi
else
  log "${GREEN}✅ No moderate or higher vulnerabilities found${NC}"
fi

# 2. License Compliance Check
log "${BLUE}📄 Checking License Compliance...${NC}"
if $GENERATE_REPORT; then
  pnpm licenses list --json > "$REPORTS_DIR/licenses-$TIMESTAMP.json" 2>/dev/null || true
fi

# 3. Outdated Dependencies Check
log "${BLUE}📅 Checking for Outdated Dependencies...${NC}"
if $GENERATE_REPORT; then
  pnpm outdated --format json > "$REPORTS_DIR/outdated-$TIMESTAMP.json" 2>/dev/null || true
fi

# 4. Snyk Scan (if available)
if command_exists snyk; then
  log "${BLUE}🐍 Running Snyk Security Scan...${NC}"
  
  if $GENERATE_REPORT; then
    snyk test --json > "$REPORTS_DIR/snyk-$TIMESTAMP.json" 2>/dev/null || true
  fi
  
  # Run Snyk test
  if snyk test --severity-threshold=high; then
    log "${GREEN}✅ Snyk scan passed${NC}"
  else
    log "${YELLOW}⚠️  Snyk found high or critical vulnerabilities${NC}"
    if $CI_MODE; then
      echo "::warning::Snyk found high or critical vulnerabilities"
    fi
  fi
else
  log "${YELLOW}⚠️  Snyk CLI not installed - skipping Snyk scan${NC}"
  log "   Install with: npm install -g snyk"
fi

# 5. Generate Security Summary Report
if $GENERATE_REPORT; then
  log "${BLUE}📊 Generating Security Summary Report...${NC}"
  
  SUMMARY_FILE="$REPORTS_DIR/security-summary-$TIMESTAMP.md"
  
  cat > "$SUMMARY_FILE" << EOF
# WellFlow Security Scan Report

**Scan Date:** $(date)  
**Project:** WellFlow Oil & Gas Production Monitoring Platform  
**Scan Type:** Automated Security Vulnerability Scan  

## Summary

This report contains the results of automated security vulnerability scanning for the WellFlow platform.

## Scan Results

### NPM Audit
- Report: npm-audit-$TIMESTAMP.json
- Text Report: npm-audit-$TIMESTAMP.txt

### License Compliance
- Report: licenses-$TIMESTAMP.json

### Outdated Dependencies
- Report: outdated-$TIMESTAMP.json

### Snyk Security Scan
- Report: snyk-$TIMESTAMP.json (if available)

## Compliance Notes

This scan is performed in accordance with:
- NIST Cybersecurity Framework
- IEC 62443 (Industrial Cybersecurity)
- API 1164 (Pipeline SCADA Security)

## Next Steps

1. Review all identified vulnerabilities
2. Prioritize fixes based on severity and exploitability
3. Update dependencies with security patches
4. Document remediation actions
5. Schedule follow-up scans

## Contact

For questions about this security scan, contact the WellFlow security team.
EOF

  log "${GREEN}✅ Security summary report generated: $SUMMARY_FILE${NC}"
fi

# 6. Final Status
log "${BLUE}🏁 Security Scan Complete${NC}"
echo ""
echo -e "${GREEN}Security scan completed successfully!${NC}"
echo "Reports saved to: $REPORTS_DIR"

if $CI_MODE; then
  echo "::notice::Security vulnerability scan completed"
fi
