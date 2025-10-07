#!/bin/bash

# Security Testing Script
# Tests all security features automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
JWT_TOKEN="${JWT_TOKEN:-}"

echo "========================================="
echo "Security Testing Suite"
echo "========================================="
echo "Worker URL: $WORKER_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Function to run test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"

    TOTAL=$((TOTAL + 1))
    echo -n "Test $TOTAL: $test_name... "

    result=$(eval "$command" 2>&1) || true

    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}FAIL${NC}"
        echo "  Expected pattern: $expected_pattern"
        echo "  Got: $result"
        FAILED=$((FAILED + 1))
    fi
}

# Check if JWT token is provided
if [ -z "$JWT_TOKEN" ]; then
    echo -e "${YELLOW}Warning: JWT_TOKEN not set. Some tests will be skipped.${NC}"
    echo "To set: export JWT_TOKEN='your_jwt_token'"
    echo ""
fi

echo "========================================="
echo "Phase 1: Input Validation Tests"
echo "========================================="

# Test 1: Empty request
run_test "Empty request rejected" \
    "curl -s -X POST $WORKER_URL/api/parse-job \
        -H 'Authorization: Bearer $JWT_TOKEN' \
        -H 'Content-Type: application/json' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: $FRONTEND_URL' \
        -d '{}'" \
    "Either url or text must be provided"

# Test 2: Text too short
run_test "Short text rejected" \
    "curl -s -X POST $WORKER_URL/api/parse-job \
        -H 'Authorization: Bearer $JWT_TOKEN' \
        -H 'Content-Type: application/json' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: $FRONTEND_URL' \
        -d '{\"text\":\"Hi\"}'" \
    "Text too short"

echo ""
echo "========================================="
echo "Phase 2: CSRF Protection Tests"
echo "========================================="

# Test 3: Missing X-Requested-With
run_test "Missing X-Requested-With rejected" \
    "curl -s -X POST $WORKER_URL/api/parse-job \
        -H 'Authorization: Bearer $JWT_TOKEN' \
        -H 'Content-Type: application/json' \
        -H 'Origin: $FRONTEND_URL' \
        -d '{\"text\":\"Test job description\"}'" \
    "Missing X-Requested-With"

# Test 4: Wrong origin
run_test "Wrong origin rejected" \
    "curl -s -X POST $WORKER_URL/api/parse-job \
        -H 'Authorization: Bearer $JWT_TOKEN' \
        -H 'Content-Type: application/json' \
        -H 'X-Requested-With: XMLHttpRequest' \
        -H 'Origin: http://evil.com' \
        -d '{\"text\":\"Test job description\"}'" \
    "origin not allowed"

echo ""
echo "========================================="
echo "Phase 3: SSRF Protection Tests"
echo "========================================="

if [ -n "$JWT_TOKEN" ]; then
    # Test 5: Localhost URL rejected
    run_test "Localhost URL rejected" \
        "curl -s -X POST $WORKER_URL/api/parse-job \
            -H 'Authorization: Bearer $JWT_TOKEN' \
            -H 'Content-Type: application/json' \
            -H 'X-Requested-With: XMLHttpRequest' \
            -H 'Origin: $FRONTEND_URL' \
            -d '{\"url\":\"http://localhost/test\"}'" \
        "not in trusted job sites list"

    # Test 6: Private IP rejected
    run_test "Private IP rejected" \
        "curl -s -X POST $WORKER_URL/api/parse-job \
            -H 'Authorization: Bearer $JWT_TOKEN' \
            -H 'Content-Type: application/json' \
            -H 'X-Requested-With: XMLHttpRequest' \
            -H 'Origin: $FRONTEND_URL' \
            -d '{\"url\":\"http://192.168.1.1/test\"}'" \
        "not in trusted job sites list"

    # Test 7: Untrusted domain rejected
    run_test "Untrusted domain rejected" \
        "curl -s -X POST $WORKER_URL/api/parse-job \
            -H 'Authorization: Bearer $JWT_TOKEN' \
            -H 'Content-Type: application/json' \
            -H 'X-Requested-With: XMLHttpRequest' \
            -H 'Origin: $FRONTEND_URL' \
            -d '{\"url\":\"https://example.com/job\"}'" \
        "not in trusted job sites list"
else
    echo "Skipping SSRF tests (JWT_TOKEN not set)"
fi

echo ""
echo "========================================="
echo "Phase 4: Security Headers Tests"
echo "========================================="

# Test 8: Security headers present
run_test "CSP header present" \
    "curl -s -I $WORKER_URL/health" \
    "content-security-policy"

run_test "X-Content-Type-Options present" \
    "curl -s -I $WORKER_URL/health" \
    "x-content-type-options.*nosniff"

run_test "X-Frame-Options present" \
    "curl -s -I $WORKER_URL/health" \
    "x-frame-options.*DENY"

# Test 9: Deprecated header absent
if curl -s -I $WORKER_URL/health | grep -iq "x-xss-protection"; then
    echo -e "Test $((TOTAL + 1)): X-XSS-Protection absent... ${RED}FAIL${NC} (header should not be present)"
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
else
    echo -e "Test $((TOTAL + 1)): X-XSS-Protection absent... ${GREEN}PASS${NC}"
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
fi

echo ""
echo "========================================="
echo "Phase 5: Rate Limiting Tests"
echo "========================================="

if [ -n "$JWT_TOKEN" ]; then
    echo "Testing rate limiting (this will take ~12 seconds)..."

    SUCCESS_COUNT=0
    RATE_LIMITED=false

    for i in {1..12}; do
        response=$(curl -s -w "\n%{http_code}" -X POST $WORKER_URL/api/parse-job \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -H "X-Requested-With: XMLHttpRequest" \
            -H "Origin: $FRONTEND_URL" \
            -d '{"text":"This is a test job description that meets the minimum length requirement of fifty characters for validation purposes."}' 2>&1)

        http_code=$(echo "$response" | tail -n1)

        if [ "$http_code" = "429" ]; then
            RATE_LIMITED=true
            break
        elif [ "$http_code" = "200" ] || [ "$http_code" = "422" ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi

        sleep 1
    done

    TOTAL=$((TOTAL + 1))
    if [ "$RATE_LIMITED" = true ] && [ $SUCCESS_COUNT -ge 8 ]; then
        echo -e "Test $TOTAL: Rate limiting enforced... ${GREEN}PASS${NC} ($SUCCESS_COUNT requests succeeded before limit)"
        PASSED=$((PASSED + 1))
    else
        echo -e "Test $TOTAL: Rate limiting enforced... ${RED}FAIL${NC} (Expected limit after ~10 requests)"
        FAILED=$((FAILED + 1))
    fi
else
    echo "Skipping rate limiting tests (JWT_TOKEN not set)"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo "Security features are working correctly."
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    echo "Please review failed tests and check the implementation."
    exit 1
fi
