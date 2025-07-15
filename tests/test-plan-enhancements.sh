#!/bin/bash

# Test plan command enhancements

set -e

echo "🧪 Testing Plan Command Enhancements"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create a test directory
TEST_DIR="test-plan-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Create a test project with auth-related files
cat > package.json << 'EOF'
{
  "name": "test-auth-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0"
  }
}
EOF

mkdir -p src/auth src/routes
cat > src/auth/middleware.js << 'EOF'
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verify token logic here
  next();
}

module.exports = { authenticate };
EOF

cat > src/routes/auth.js << 'EOF'
const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  // Login logic
  res.json({ token: 'fake-jwt-token' });
});

module.exports = router;
EOF

echo ""
echo "Test 1: Basic plan generation (Claude-optimized)"
if gsum plan "add user registration" --claude-optimized 2>&1 | grep -q "IMPLEMENTATION PLAN"; then
  echo -e "${GREEN}✓${NC} Basic plan generation works"
else
  echo -e "${RED}✗${NC} Basic plan generation failed"
  exit 1
fi

echo ""
echo "Test 2: Plan with smart files"
OUTPUT=$(gsum plan "add password reset" --smart-files 5 --verbose 2>&1)
if echo "$OUTPUT" | grep -q "Smart file selection included"; then
  echo -e "${GREEN}✓${NC} Plan with smart files works"
else
  echo -e "${RED}✗${NC} Plan with smart files failed"
  echo "$OUTPUT"
  exit 1
fi

echo ""
echo "Test 3: Claude-optimized plan"
if gsum plan "implement JWT refresh" --claude-optimized 2>&1 | grep -q "implement JWT refresh"; then
  echo -e "${GREEN}✓${NC} Claude-optimized plan generation works"
else
  echo -e "${RED}✗${NC} Claude-optimized plan failed"
  exit 1
fi

echo ""
echo "Test 4: Fresh flag (ignore cache)"
# First create cache
gsum --claude-optimized > /dev/null 2>&1

# Now test fresh flag
OUTPUT=$(gsum plan "add OAuth" --claude-optimized --fresh --verbose 2>&1)
if echo "$OUTPUT" | grep -q "Using cached project analysis"; then
  echo -e "${RED}✗${NC} Fresh flag not working - still using cache"
  exit 1
else
  echo -e "${GREEN}✓${NC} Fresh flag forces new analysis"
fi

echo ""
echo "Test 5: Task-specific file selection"
OUTPUT=$(gsum plan "fix authentication bug" --claude-optimized 2>&1)
if echo "$OUTPUT" | grep -q "auth"; then
  echo -e "${GREEN}✓${NC} Task-specific file selection works"
else
  echo -e "${RED}✗${NC} Task-specific file selection failed"
  echo "$OUTPUT"
  exit 1
fi

# Cleanup
cd ..
rm -rf "$TEST_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}All plan enhancement tests passed!${NC}"