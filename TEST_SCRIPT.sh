#!/bin/bash

###################################################################
# Test Script for AI DevOps Assistant
# Tests both backend and frontend functionality
###################################################################

set -e  # Exit on error

echo "======================================================================"
echo "AI DevOps Assistant - Automated Test Script"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3400"
FRONTEND_URL="http://localhost:3000"

###################################################################
# Test 1: Check if backend is running
###################################################################
echo "Test 1: Checking backend health..."
if curl -s "${BACKEND_URL}/health" > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
    
    # Show backend status
    HEALTH_RESPONSE=$(curl -s "${BACKEND_URL}/health")
    echo "  Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "  Start it with: cd backend && npm run dev"
    exit 1
fi
echo ""

###################################################################
# Test 2: Check backend mode (mock vs production)
###################################################################
echo "Test 2: Checking backend mode..."
MODE=$(curl -s "${BACKEND_URL}/health" | grep -o '"mode":"[^"]*"' | cut -d'"' -f4)
if [ "$MODE" = "mock" ]; then
    echo -e "${GREEN}✓ Backend is in MOCK mode (good for testing)${NC}"
elif [ "$MODE" = "production" ]; then
    echo -e "${YELLOW}⚠ Backend is in PRODUCTION mode${NC}"
    echo "  Make sure Log Analytics is configured"
else
    echo -e "${RED}✗ Could not determine backend mode${NC}"
fi
echo ""

###################################################################
# Test 3: Test AI assistant endpoint
###################################################################
echo "Test 3: Testing AI assistant endpoint..."
TEST_QUERY="Show me recent errors"

echo "  Sending query: '$TEST_QUERY'"
RESPONSE=$(curl -s -X POST "${BACKEND_URL}/devAssistant" \
    -H "Content-Type: application/json" \
    -d "{\"data\": \"$TEST_QUERY\"}")

if echo "$RESPONSE" | grep -q "result"; then
    echo -e "${GREEN}✓ AI assistant responded successfully${NC}"
    
    # Show first 200 chars of response
    RESULT=$(echo "$RESPONSE" | grep -o '"result":"[^"]*"' | cut -d'"' -f4 | head -c 200)
    echo "  Response preview: ${RESULT}..."
else
    echo -e "${RED}✗ AI assistant failed to respond${NC}"
    echo "  Response: $RESPONSE"
    exit 1
fi
echo ""

###################################################################
# Test 4: Test multiple sample queries
###################################################################
echo "Test 4: Testing sample queries..."

QUERIES=(
    "Show me recent errors"
    "Find checkout failures"
    "Check authentication errors"
)

for QUERY in "${QUERIES[@]}"; do
    echo "  Testing: '$QUERY'"
    
    RESPONSE=$(curl -s -X POST "${BACKEND_URL}/devAssistant" \
        -H "Content-Type: application/json" \
        -d "{\"data\": \"$QUERY\"}" \
        --max-time 30)
    
    if echo "$RESPONSE" | grep -q "result"; then
        echo -e "    ${GREEN}✓ Success${NC}"
    else
        echo -e "    ${RED}✗ Failed${NC}"
    fi
done
echo ""

###################################################################
# Test 5: Check if frontend is accessible
###################################################################
echo "Test 5: Checking frontend..."
if curl -s "${FRONTEND_URL}" > /dev/null; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
    echo "  URL: ${FRONTEND_URL}"
else
    echo -e "${YELLOW}⚠ Frontend is not running${NC}"
    echo "  Start it with: cd frontend && npm run dev"
fi
echo ""

###################################################################
# Test 6: Check environment configuration
###################################################################
echo "Test 6: Checking environment configuration..."

# Check backend .env
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ Backend .env file exists${NC}"
    
    if grep -q "USE_MOCK_DATA=true" backend/.env; then
        echo "  Mode: MOCK DATA (good for testing)"
    elif grep -q "USE_MOCK_DATA=false" backend/.env; then
        echo "  Mode: PRODUCTION"
    fi
    
    if grep -q "GOOGLE_GENAI_API_KEY=" backend/.env; then
        echo "  API Key: Configured"
    fi
else
    echo -e "${RED}✗ Backend .env file missing${NC}"
    echo "  Copy from: backend/env.example"
fi

# Check frontend .env.local
if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓ Frontend .env.local file exists${NC}"
    
    API_URL=$(grep "NEXT_PUBLIC_API_URL" frontend/.env.local | cut -d'=' -f2)
    echo "  API URL: $API_URL"
else
    echo -e "${YELLOW}⚠ Frontend .env.local file missing${NC}"
    echo "  Copy from: frontend/env.local.example"
fi
echo ""

###################################################################
# Test 7: Performance test
###################################################################
echo "Test 7: Performance test..."
echo "  Measuring response time..."

START_TIME=$(date +%s%N)
curl -s -X POST "${BACKEND_URL}/devAssistant" \
    -H "Content-Type: application/json" \
    -d '{"data": "Show me errors"}' > /dev/null
END_TIME=$(date +%s%N)

DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))

if [ $DURATION -lt 5000 ]; then
    echo -e "${GREEN}✓ Response time: ${DURATION}ms (excellent)${NC}"
elif [ $DURATION -lt 10000 ]; then
    echo -e "${YELLOW}⚠ Response time: ${DURATION}ms (acceptable)${NC}"
else
    echo -e "${RED}✗ Response time: ${DURATION}ms (slow)${NC}"
fi
echo ""

###################################################################
# Summary
###################################################################
echo "======================================================================"
echo "Test Summary"
echo "======================================================================"
echo ""
echo "All critical tests passed! Your system is ready for demo."
echo ""
echo "Next steps:"
echo "1. Open browser to ${FRONTEND_URL}"
echo "2. Try the sample queries"
echo "3. Check backend logs for AI reasoning"
echo "4. Review DEMO_SCRIPT.txt for presentation flow"
echo ""
echo "Good luck with your presentation! 🚀"
echo ""

