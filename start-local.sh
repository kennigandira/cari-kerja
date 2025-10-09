#!/bin/bash

# Start Local Development Environment
# Runs frontend + workers locally

set -e

# Derive repo root from script location
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "========================================="
echo "Starting Local Development Environment"
echo "========================================="
echo ""

# Check if .dev.vars exists
if [ ! -f "$REPO_ROOT/app/workers/.dev.vars" ]; then
    echo -e "${RED}✗ app/workers/.dev.vars not found${NC}"
    echo ""
    echo "Create it by running:"
    echo "  cd $REPO_ROOT/app/workers"
    echo "  cp .dev.vars.example .dev.vars"
    echo ""
    echo "Then edit .dev.vars and add your actual secrets."
    echo "See LOCAL_DEV_SETUP.md for details."
    exit 1
fi

echo -e "${GREEN}✓${NC} .dev.vars found"

# Check if .env.local exists
if [ ! -f "$REPO_ROOT/app/frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠${NC} app/frontend/.env.local not found (will use .env)"
else
    echo -e "${GREEN}✓${NC} .env.local found (using local worker)"
fi

echo ""
echo -e "${YELLOW}Starting services...${NC}"
echo ""
echo "This will open 2 terminal tabs:"
echo "  Tab 1: Worker (http://localhost:8787)"
echo "  Tab 2: Frontend (http://localhost:5173)"
echo ""
echo "Press Ctrl+C in each tab to stop services"
echo ""

# Detect terminal and open tabs
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript <<EOF
tell application "Terminal"
    activate
    set workerTab to do script "cd $REPO_ROOT/app/workers && echo 'Starting Worker...' && wrangler dev --local"
    set frontendTab to do script "cd $REPO_ROOT/app/frontend && echo 'Starting Frontend...' && bun run dev"
end tell
EOF
    echo -e "${GREEN}✓${NC} Services started in new terminal tabs"
else
    # Linux/Other
    echo "Manual startup required:"
    echo ""
    echo "Terminal 1 - Worker:"
    echo "  cd $REPO_ROOT/app/workers"
    echo "  wrangler dev --local"
    echo ""
    echo "Terminal 2 - Frontend:"
    echo "  cd $REPO_ROOT/app/frontend"
    echo "  bun run dev"
fi

echo ""
echo "========================================="
echo "Local Development Ready!"
echo "========================================="
echo ""
echo -e "${GREEN}Open in browser:${NC} http://localhost:5173"
echo ""
echo -e "${YELLOW}To stop:${NC} Press Ctrl+C in each terminal tab"
echo ""
