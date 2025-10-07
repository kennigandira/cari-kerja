#!/bin/bash

# Quick Security Test - Tests critical security features
# Run after starting all services

echo "========================================="
echo "Quick Security Test"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

WORKER_URL="${WORKER_URL:-http://localhost:8787}"

echo -e "${BLUE}Testing Worker Health...${NC}"
if curl -s $WORKER_URL/health | grep -q "ok"; then
    echo -e "${GREEN}✓ Worker is running${NC}"
else
    echo -e "${RED}✗ Worker not responding${NC}"
    echo "Start worker with: cd app/workers && bun run dev"
    exit 1
fi

echo ""
echo -e "${BLUE}Testing Security Headers...${NC}"

HEADERS=$(curl -s -I $WORKER_URL/health)

check_header() {
    local header="$1"
    if echo "$HEADERS" | grep -iq "$header"; then
        echo -e "${GREEN}✓${NC} $header present"
        return 0
    else
        echo -e "${RED}✗${NC} $header missing"
        return 1
    fi
}

check_header "content-security-policy"
check_header "x-content-type-options"
check_header "x-frame-options"
check_header "referrer-policy"

# Check deprecated header is absent
if echo "$HEADERS" | grep -iq "x-xss-protection"; then
    echo -e "${RED}✗${NC} X-XSS-Protection present (should be removed)"
else
    echo -e "${GREEN}✓${NC} X-XSS-Protection absent (correctly removed)"
fi

echo ""
echo -e "${BLUE}Testing CSRF Protection...${NC}"

CSRF_TEST=$(curl -s -X POST $WORKER_URL/api/parse-job \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:5173" \
    -d '{"text":"test"}' 2>&1)

if echo "$CSRF_TEST" | grep -q "Missing X-Requested-With\|Missing or invalid authorization"; then
    echo -e "${GREEN}✓${NC} CSRF protection active (requires headers)"
else
    echo -e "${YELLOW}⚠${NC} Unexpected CSRF response: $CSRF_TEST"
fi

echo ""
echo -e "${BLUE}Testing Authentication Requirement...${NC}"

AUTH_TEST=$(curl -s -X POST $WORKER_URL/api/parse-job \
    -H "Content-Type: application/json" \
    -H "X-Requested-With: XMLHttpRequest" \
    -H "Origin: http://localhost:5173" \
    -d '{"text":"test"}' 2>&1)

if echo "$AUTH_TEST" | grep -q "Missing or invalid authorization"; then
    echo -e "${GREEN}✓${NC} Authentication required"
else
    echo -e "${RED}✗${NC} Endpoint accessible without auth"
fi

echo ""
echo "========================================="
echo "Quick Test Complete"
echo "========================================="
echo ""
echo -e "${YELLOW}For full testing:${NC}"
echo "1. Register and login to get JWT token"
echo "2. export JWT_TOKEN='your_token'"
echo "3. ./test-security.sh"
echo ""
echo -e "${YELLOW}For manual testing:${NC}"
echo "See: TESTING_QUICKSTART.md"
echo ""
