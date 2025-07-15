#!/bin/bash

# Test Claude optimization features

set -e

echo "🧪 Testing Claude Optimization Features"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create a test directory
TEST_DIR="test-claude-opt-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Create a simple test project
cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF

mkdir -p src
cat > src/index.js << 'EOF'
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

module.exports = app;
EOF

cat > src/server.js << 'EOF'
const app = require('./index');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

echo ""
echo "Test 1: Claude optimization flag"
if gsum --claude-optimized 2>&1 | grep -q "ARCHITECTURE:"; then
  echo -e "${GREEN}✓${NC} Claude optimization generates correct format"
else
  echo -e "${RED}✗${NC} Claude optimization failed"
  exit 1
fi

echo ""
echo "Test 2: Cache creation"
if [ -f ".gsum/context.md" ]; then
  echo -e "${GREEN}✓${NC} Cache file created"
else
  echo -e "${RED}✗${NC} Cache file not created"
  exit 1
fi

echo ""
echo "Test 3: Cache usage (second run)"
# Clear output first
rm -f output1.txt output2.txt

# First run
gsum --claude-optimized > output1.txt 2>&1

# Second run should use cache
gsum --claude-optimized --verbose > output2.txt 2>&1

if grep -q "Using cached Claude context" output2.txt; then
  echo -e "${GREEN}✓${NC} Cache is being used on second run"
else
  echo -e "${RED}✗${NC} Cache not being used"
  cat output2.txt
  exit 1
fi

echo ""
echo "Test 4: Smart files integration"
# Clear cache to force fresh analysis
rm -rf .gsum/
# Test that smart files option works
OUTPUT=$(gsum --claude-optimized --smart-files 5 --verbose 2>&1)
if echo "$OUTPUT" | grep -q "Smart file selection included"; then
  echo -e "${GREEN}✓${NC} Smart files integrated with Claude optimization"
else
  echo -e "${RED}✗${NC} Smart files integration failed"
  echo "$OUTPUT"
  exit 1
fi

echo ""
echo "Test 5: Save command with Claude optimization"
# Use claude-only mode to avoid API calls
gsum save --claude-optimized --claude-only --force

if [ -f "ARCHITECTURE.gsum.md" ] && [ -f ".gsum/context.md" ]; then
  echo -e "${GREEN}✓${NC} Save command creates both files"
else
  echo -e "${RED}✗${NC} Save command failed to create both files"
  ls -la .gsum/ 2>/dev/null || echo "No .gsum directory"
  exit 1
fi

echo ""
echo "Test 6: Claude Code auto-detection"
# Simulate Claude Code environment
CLAUDE_CODE=true gsum --verbose 2>&1 > output3.txt

if grep -q "Detected Claude Code environment" output3.txt; then
  echo -e "${GREEN}✓${NC} Claude Code environment detected"
else
  echo -e "${RED}✗${NC} Claude Code detection failed"
  exit 1
fi

# Cleanup
cd ..
rm -rf "$TEST_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}All Claude optimization tests passed!${NC}"