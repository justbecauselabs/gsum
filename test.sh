#!/bin/bash

# gsum CLI Test Suite

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  Testing $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "🧪 gsum CLI Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Check if gsum is installed
echo "📋 Checking installation..."
if ! command -v gsum &> /dev/null; then
    echo -e "${RED}✗ gsum not found in PATH${NC}"
    echo "  Please run 'make install' first"
    exit 1
fi
echo -e "  ${GREEN}✓${NC} gsum found in PATH"
echo

# Run tests
echo "🔧 Running tests..."

# Test 1: Version command
run_test "version command" "gsum version"

# Test 2: Help command
run_test "help command" "gsum --help"

# Test 3: CLI loads without errors
run_test "CLI initialization" "gsum --version"

# Test 4: Verbose flag
run_test "verbose flag" "gsum -v --help"

# Test 5: Debug flag
run_test "debug flag" "gsum -d --help"

# Create a test directory
TEST_DIR="/tmp/gsum-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Create some test files
echo "# Test Project" > README.md
echo '{"name": "test-project", "version": "1.0.0"}' > package.json
mkdir -p src
echo "console.log('test');" > src/index.js

# Test 6: Default summary command
run_test "default summary" "gsum"

# Test 7: Save command (dry run - don't actually save)
run_test "save command syntax" "gsum save --help"

# Test 8: Plan command syntax
run_test "plan command syntax" "gsum plan --help"

# Test 9: Update command syntax
run_test "update command syntax" "gsum update --help"

# Test 10: Format option
run_test "format option" "gsum --format markdown"

# Test 11: Node.js CLI module loading
run_test "module loading" "node $(which gsum) version"

# Clean up
cd - > /dev/null
rm -rf "$TEST_DIR"

# Summary
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Results:"
echo -e "  Total:  $TESTS_RUN"
echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "🎉 ${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "❌ ${RED}Some tests failed${NC}"
    exit 1
fi