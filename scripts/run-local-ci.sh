#!/bin/bash

# WellFlow Local CI/CD Testing Script
# This script runs the same checks as GitHub Actions locally

set -e

echo "🚀 WellFlow Local CI/CD Testing"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}"
    else
        echo -e "${RED}❌ $2 FAILED${NC}"
        return 1
    fi
}

# Function to run command with status
run_check() {
    echo -e "${BLUE}🔍 Running: $1${NC}"
    if eval "$2"; then
        print_status 0 "$1"
        return 0
    else
        print_status 1 "$1"
        return 1
    fi
}

# Create reports directories
mkdir -p security-reports accessibility-reports performance-reports license-reports

echo -e "${YELLOW}📋 PHASE 1: Code Quality & Standards${NC}"
echo "-----------------------------------"

# Linting
run_check "ESLint Code Quality" "pnpm run lint"

# Type checking
run_check "TypeScript Type Check" "pnpm run check-types"

# Formatting
run_check "Prettier Code Formatting" "pnpm run format:check"

echo ""
echo -e "${YELLOW}🧪 PHASE 2: Testing & Coverage${NC}"
echo "-------------------------------"

# Unit tests
run_check "Unit Tests" "pnpm run test"

# Test coverage
run_check "Test Coverage Analysis" "pnpm run test:coverage"

echo ""
echo -e "${YELLOW}🔒 PHASE 3: Security Scanning${NC}"
echo "------------------------------"

# Security audit
run_check "NPM Security Audit" "pnpm run security:audit"

# License compliance
run_check "License Compliance Check" "pnpm run license:check"

# SAST scanning
run_check "SAST Security Scanning" "pnpm run sast:check"

# Secrets scanning
run_check "Secrets Scanning" "pnpm run secrets:check"

# API security testing
run_check "API Security Testing" "pnpm run security:api"

# Infrastructure security
run_check "Infrastructure Security" "pnpm run security:infrastructure"

echo ""
echo -e "${YELLOW}♿ PHASE 4: Accessibility Testing${NC}"
echo "--------------------------------"

# Accessibility testing
run_check "WCAG Accessibility Testing" "pnpm run accessibility:test"

echo ""
echo -e "${YELLOW}⚡ PHASE 5: Performance Testing${NC}"
echo "-------------------------------"

# Performance testing
run_check "Performance Budget Analysis" "pnpm run performance:test"

echo ""
echo -e "${YELLOW}🏗️ PHASE 6: Build Testing${NC}"
echo "-------------------------"

# Build all applications
run_check "Application Build" "pnpm run build"

echo ""
echo -e "${GREEN}🎉 LOCAL CI/CD TESTING COMPLETED!${NC}"
echo "=================================="
echo ""
echo "📊 Reports generated in:"
echo "  - security-reports/"
echo "  - accessibility-reports/"
echo "  - performance-reports/"
echo "  - license-reports/"
echo ""
echo "🚀 Ready to commit and push!"
