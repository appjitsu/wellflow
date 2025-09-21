#!/bin/bash

# WellFlow Pre-commit Quick Check
# Run essential checks before committing

set -e

echo "🔍 WellFlow Pre-commit Checks"
echo "============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Quick status function
quick_check() {
    echo -e "${YELLOW}⏳ $1...${NC}"
    if eval "$2" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $1 PASSED${NC}"
    else
        echo -e "${RED}❌ $1 FAILED${NC}"
        echo "Run: $2"
        exit 1
    fi
}

# Essential pre-commit checks
quick_check "Linting" "pnpm run lint"
quick_check "Type Checking" "pnpm run check-types"
quick_check "Formatting" "pnpm run format:check"
quick_check "Unit Tests" "pnpm run test"
quick_check "Security Audit" "pnpm run security:audit"

echo ""
echo -e "${GREEN}🎉 All pre-commit checks passed!${NC}"
echo -e "${YELLOW}💡 For full CI testing, run: ./scripts/run-local-ci.sh${NC}"
