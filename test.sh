#!/bin/bash

# gsum test suite - Tests happy path scenarios

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test directory
TEST_DIR="/tmp/gsum-test-$$"
TEST_PROJECT="$TEST_DIR/test-project"

# Cleanup function
cleanup() {
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing: $test_name... "
    
    if output=$($test_command 2>&1); then
        if echo "$output" | grep -q "$expected_pattern"; then
            echo "${GREEN}✓ PASSED${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo "${RED}✗ FAILED${NC}"
            echo "  Expected pattern: $expected_pattern"
            echo "  Got output: $output"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        echo "${RED}✗ FAILED (command error)${NC}"
        echo "  Error: $output"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Header
echo "🧪 gsum Test Suite"
echo "=================="
echo

# Check prerequisites
echo "Checking prerequisites..."

if [ ! -x "$HOME/bin/smart-gsum" ]; then
    echo "${RED}✗ smart-gsum not found. Run 'make install' first.${NC}"
    exit 1
fi

if [ ! -x "$HOME/bin/gsummarize-wrapper" ]; then
    echo "${RED}✗ gsummarize-wrapper not found. Run 'make install' first.${NC}"
    exit 1
fi

echo "${GREEN}✓${NC} All prerequisites found"
echo

# Create test environment
echo "Setting up test environment..."
mkdir -p "$TEST_PROJECT"
cd "$TEST_PROJECT"

# Initialize git repo
git init --quiet
git config user.email "test@example.com"
git config user.name "Test User"

# Create test files
cat > README.md << 'EOF'
# Test Project

This is a test project for gsum.

## Setup
- Run `npm install`
- Run `npm start`

## Features
- Feature 1
- Feature 2
EOF

mkdir -p src/components
cat > src/components/Button.js << 'EOF'
import React from 'react';

export function Button({ label, onClick }) {
    return (
        <button onClick={onClick}>
            {label}
        </button>
    );
}
EOF

cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "description": "Test project for gsum",
  "scripts": {
    "start": "node index.js"
  }
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
*.log
EOF

# Initial commit
git add -A
git commit -m "Initial commit" --quiet

echo "${GREEN}✓${NC} Test environment ready"
echo

# Run tests
echo "Running tests..."
echo

# Create a mock gemini for testing if real one doesn't exist
if ! command -v gemini &> /dev/null; then
    echo "${YELLOW}⚠️  Gemini not found, using mock for testing${NC}"
    cat > "$HOME/bin/gemini" << 'EOF'
#!/bin/bash
# Mock gemini for testing
echo "Mock Gemini output"
# Create the expected output file
if [[ "$*" == *"--yolo"* ]]; then
    # Extract directory from prompt
    cat > DIRECTORY_SUMMARY.md << 'MOCKEOF'
# Directory Summary Report

Generated on: $(date)
Path: $(pwd)

## Overview
This is a mock summary for testing purposes.

## Project Structure
- src/
  - components/
- package.json
- README.md

## Architecture
Mock architecture description.
MOCKEOF
fi
EOF
    chmod +x "$HOME/bin/gemini"
fi

# Test 1: First run should generate summary
run_test "First run generates summary" \
    "$HOME/bin/smart-gsum $TEST_PROJECT" \
    "No existing summary found. Generating fresh summary"

# Verify file was created
if [ -f "$TEST_PROJECT/DIRECTORY_SUMMARY.md" ]; then
    echo "${GREEN}✓${NC} DIRECTORY_SUMMARY.md created"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗${NC} DIRECTORY_SUMMARY.md not created"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Verify git hash was added
if grep -q "<!-- git-hash:" "$TEST_PROJECT/DIRECTORY_SUMMARY.md" 2>/dev/null; then
    echo "${GREEN}✓${NC} Git hash added to summary"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗${NC} Git hash not found in summary"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 2: No changes should load cached
sleep 1  # Ensure different timestamp
run_test "No changes loads cached summary" \
    "$HOME/bin/smart-gsum $TEST_PROJECT" \
    "Summary is up to date"

# Test 3: Minor changes should show diff
echo "// New comment" >> src/components/Button.js
git add -A
git commit -m "Add comment" --quiet

run_test "Minor changes show diff" \
    "$HOME/bin/smart-gsum $TEST_PROJECT" \
    "Changes are trivial. Loading existing summary with diff"

# Test 4: Create new branch
git checkout -b feature-branch --quiet
echo "export const VERSION = '2.0.0';" > src/version.js
git add -A
git commit -m "Add version file" --quiet

# First run on new branch should create branch-specific file
run_test "New branch creates branch-specific summary" \
    "$HOME/bin/smart-gsum $TEST_PROJECT" \
    "Branch has diverged from stored hash"

# Verify branch-specific file exists
if [ -f "$TEST_PROJECT/DIRECTORY_SUMMARY.feature-branch.md" ]; then
    echo "${GREEN}✓${NC} Branch-specific summary created"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗${NC} Branch-specific summary not created"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 5: Non-git directory
NON_GIT_DIR="$TEST_DIR/non-git"
mkdir -p "$NON_GIT_DIR"
echo "Some content" > "$NON_GIT_DIR/file.txt"

run_test "Non-git directory generates summary" \
    "$HOME/bin/smart-gsum $NON_GIT_DIR" \
    "Not a git repository"

echo
echo "=================="
echo "Test Results:"
echo "  Tests run:    $TESTS_RUN"
echo "  Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo "  Failed:       ${RED}$TESTS_FAILED${NC}"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo "${RED}✗ Some tests failed${NC}"
    exit 1
fi