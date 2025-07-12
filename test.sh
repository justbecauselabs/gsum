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
    # Remove mock gemini if we created it
    if [ -f "$HOME/bin/gemini.mock" ]; then
        rm -f "$HOME/bin/gemini"
        mv "$HOME/bin/gemini.mock" "$HOME/bin/gemini" 2>/dev/null || true
    fi
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
    
    # Run command and capture output
    set +e
    output=$($test_command 2>&1)
    exit_code=$?
    set -e
    
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q "$expected_pattern"; then
        echo "${GREEN}✓ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "${RED}✗ FAILED${NC}"
        echo "  Expected pattern: $expected_pattern"
        echo "  Exit code: $exit_code"
        echo "  Got output:"
        echo "$output" | head -20 | sed 's/^/    /'
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
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

# Check MCP server installation
if [ ! -x "$HOME/bin/gsum-mcp-server/index.js" ]; then
    echo "${RED}✗ gsum MCP server not found. Run 'make install' first.${NC}"
    exit 1
fi

# Check MCP server dependencies
if [ ! -d "$HOME/bin/gsum-mcp-server/node_modules" ]; then
    echo "${RED}✗ gsum MCP server dependencies not installed. Run 'make install' first.${NC}"
    exit 1
fi

echo "${GREEN}✓${NC} All prerequisites found"
echo

# Create mock gemini for testing
MOCK_CREATED=false
echo "${YELLOW}⚠️  Creating mock gemini for testing${NC}"

# Backup existing gemini if it exists in HOME/bin
if [ -f "$HOME/bin/gemini" ]; then
    mv "$HOME/bin/gemini" "$HOME/bin/gemini.mock"
fi

# Ensure bin directory exists
mkdir -p "$HOME/bin"

# Add to PATH at the beginning to ensure our mock takes precedence
export PATH="$HOME/bin:$PATH"

# Create mock gemini
cat > "$HOME/bin/gemini" << 'EOF'
#!/bin/bash
# Mock gemini for testing

# Simple mock that creates appropriate output when called with --yolo
if [[ "$*" == *"--yolo"* ]]; then
    # Read from stdin to get the prompt
    prompt=$(cat)
    
    # Check if this is for an implementation plan
    if echo "$prompt" | grep -q "IMPLEMENTATION PLAN"; then
        # Generate implementation plan to stdout
        cat << 'EOFPLAN'
# IMPLEMENTATION PLAN

## TASK OVERVIEW
This is a mock implementation plan for testing.

## TECHNICAL APPROACH
- Use modern React patterns
- Implement proper state management
- Follow existing code conventions

## IMPLEMENTATION STEPS
1. Create new components
2. Update existing files
3. Add tests

## CODE STRUCTURE
- New components in src/components/
- Tests in src/__tests__/

## TESTING PLAN
- Unit tests for all components
- Integration tests for workflows

## ESTIMATED EFFORT
- Development: 2 days
- Testing: 1 day
- Total: 3 days
EOFPLAN
    else
        # Generate regular summary - write to DIRECTORY_SUMMARY.md in current directory
        # Note: gsummarize-wrapper has already cd'd to the target directory
        cat > ./DIRECTORY_SUMMARY.md << 'EOFSUM'
# Directory Summary Report

Generated on: 2024-01-01
Path: /test/path

## Overview

This is a mock summary generated for testing purposes.

## Project Structure

```
test-project/
├── src/
│   └── components/
│       └── Button.js
├── package.json
├── README.md
└── .gitignore
```

## Architecture Overview

This is a test project with a simple React component structure.

## Setup & Getting Started

1. Run `npm install`
2. Run `npm start`

## Key Modules & Components

### Button Component
- Location: `src/components/Button.js`
- Purpose: Simple button component for testing

EOFSUM
        echo "Created DIRECTORY_SUMMARY.md successfully" >&2
    fi
fi
EOF
chmod +x "$HOME/bin/gemini"
MOCK_CREATED=true

# Create test environment
echo
echo "Setting up test environment..."
mkdir -p "$TEST_PROJECT"
cd "$TEST_PROJECT"

# Initialize git repo with main branch
git init --quiet -b main
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
IMPLEMENTATION_PLAN_*.gsum.md
EOF

# Initial commit
git add -A
git commit -m "Initial commit" --quiet

echo "${GREEN}✓${NC} Test environment ready"
echo

# Run tests
echo "Running tests..."
echo

# Test 1: Ephemeral mode (default)
echo "=== Test 1: Ephemeral mode (default) ==="
run_test "Ephemeral mode outputs to stdout" \
    "$HOME/bin/smart-gsum ." \
    "Architecture Overview"

# Test 2: Ephemeral mode with --ephemeral flag
echo
echo "=== Test 2: Ephemeral mode with explicit flag ==="
run_test "Ephemeral mode with flag outputs to stdout" \
    "$HOME/bin/smart-gsum --ephemeral ." \
    "Architecture Overview"

# Test 3: Save mode creates ARCHITECTURE.gsum.md
echo
echo "=== Test 3: Save mode ==="
run_test "Save mode creates ARCHITECTURE.gsum.md" \
    "$HOME/bin/smart-gsum --save ." \
    "Successfully generated ARCHITECTURE.gsum.md"

# Verify file was created
echo -n "Verifying ARCHITECTURE.gsum.md exists... "
if [ -f "ARCHITECTURE.gsum.md" ]; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    echo "  Directory contents:"
    ls -la | sed 's/^/    /'
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Verify git hash was added
echo -n "Verifying git hash in ARCHITECTURE.gsum.md... "
if [ -f "ARCHITECTURE.gsum.md" ] && grep -q "<!-- git-hash:" "ARCHITECTURE.gsum.md"; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    if [ -f "ARCHITECTURE.gsum.md" ]; then
        echo "  Last 5 lines of summary:"
        tail -5 ARCHITECTURE.gsum.md | sed 's/^/    /'
    fi
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 4: Save mode with no changes
echo
echo "=== Test 4: Save mode with no changes ==="
sleep 1  # Ensure different timestamp
run_test "Save mode with no changes" \
    "$HOME/bin/smart-gsum --save ." \
    "ARCHITECTURE.gsum.md is up to date"

# Test 5: Save mode with minor changes
echo
echo "=== Test 5: Save mode with minor changes ==="
echo "// New comment" >> src/components/Button.js
git add -A
git commit -m "Add comment" --quiet

run_test "Save mode with minor changes" \
    "$HOME/bin/smart-gsum --save ." \
    "Changes are trivial"

# Test 6: Save mode with major changes
echo
echo "=== Test 6: Save mode with major changes ==="

# Create many new files with substantial content to exceed 500 line threshold
for i in {1..20}; do
    cat > "src/components/Component$i.js" << EOF
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Component $i - A substantial component for testing
export default function Component$i() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const params = useParams();
    const navigate = useNavigate();
    
    useEffect(() => {
        fetchData();
    }, [params.id]);
    
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(\`/api/component$i/\${params.id}\`);
            if (!response.ok) throw new Error('Failed to fetch');
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = async (formData) => {
        try {
            const response = await fetch(\`/api/component$i\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                navigate('/success');
            }
        } catch (err) {
            console.error('Submit failed:', err);
        }
    };
    
    if (loading) return <div className="loader">Loading Component $i...</div>;
    if (error) return <div className="error">Error in Component $i: {error}</div>;
    
    return (
        <div className="component-$i">
            <h1>Component $i</h1>
            <p>This is component number $i with substantial content.</p>
            <div className="data-display">
                <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
            <button onClick={() => handleSubmit({ id: $i })}>
                Submit Component $i
            </button>
        </div>
    );
}

// Additional exports for Component $i
export const Component${i}Config = {
    name: 'Component$i',
    version: '1.0.0',
    dependencies: ['react', 'react-router-dom']
};

export function useComponent$i() {
    return { config: Component${i}Config };
}
EOF
done

git add -A
git commit -m "Major refactoring" --quiet

run_test "Save mode with major changes triggers regeneration" \
    "$HOME/bin/smart-gsum --save ." \
    "Significant changes detected"

# Test 7: Plan mode
echo
echo "=== Test 7: Plan mode ==="
echo -n "Testing: Plan mode generates implementation plan... "
set +e
output=$($HOME/bin/smart-gsum --plan "Add user authentication" . 2>&1)
exit_code=$?
set -e

if [ $exit_code -eq 0 ] && echo "$output" | grep -q "Successfully generated"; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    echo "  Exit code: $exit_code"
    echo "  Got output:"
    echo "$output" | head -10 | sed 's/^/    /'
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Verify plan file was created
echo -n "Verifying implementation plan file exists... "
if ls IMPLEMENTATION_PLAN_*.gsum.md 1> /dev/null 2>&1; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "  Created: $(ls IMPLEMENTATION_PLAN_*.gsum.md)"
else
    echo "${RED}✗ FAILED${NC}"
    echo "  Directory contents:"
    ls -la | sed 's/^/    /'
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 8: Help flag
echo
echo "=== Test 8: Help flag ==="
run_test "Help flag shows usage" \
    "$HOME/bin/smart-gsum --help" \
    "Usage: smart-gsum"

# Test 9: Non-git directory with save mode
echo
echo "=== Test 9: Non-git directory with save mode ==="
NON_GIT_DIR="$TEST_DIR/non-git"
mkdir -p "$NON_GIT_DIR"
echo "Some content" > "$NON_GIT_DIR/file.txt"
cd "$NON_GIT_DIR"

run_test "Non-git directory with save mode" \
    "$HOME/bin/smart-gsum --save ." \
    "Successfully generated ARCHITECTURE.gsum.md"

# Test 10: Directory argument
echo
echo "=== Test 10: Directory argument ==="
cd "$TEST_PROJECT"
mkdir -p subdir
echo "test" > subdir/test.txt

run_test "Directory argument works" \
    "$HOME/bin/smart-gsum --ephemeral ./subdir" \
    "Architecture Overview"

# Test 11: MCP server version check
echo
echo "=== Test 11: MCP server functionality ==="
echo -n "Testing: MCP server version check... "
set +e
output=$(node "$HOME/bin/gsum-mcp-server/index.js" --version 2>&1)
exit_code=$?
set -e

if [ $exit_code -eq 0 ] && echo "$output" | grep -q "1.1.0"; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    echo "  Exit code: $exit_code"
    echo "  Got output: $output"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 12: Gemini config check
echo
echo "=== Test 12: Gemini MCP configuration ==="
echo -n "Testing: Gemini config has gsum MCP server... "
GEMINI_CONFIG="$HOME/.config/gemini/config.json"

if [ -f "$GEMINI_CONFIG" ] && grep -q "gsum-mcp-server" "$GEMINI_CONFIG"; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    echo "  Gemini config not found or missing gsum MCP server"
    if [ -f "$GEMINI_CONFIG" ]; then
        echo "  Config file exists at: $GEMINI_CONFIG"
    else
        echo "  Config file not found at: $GEMINI_CONFIG"
    fi
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 13: MCP server can be started
echo
echo "=== Test 13: MCP server startup test ==="
echo -n "Testing: MCP server can start... "
set +e
# Start server and immediately kill it
# Use gtimeout if available (macOS with coreutils), otherwise timeout
if command -v gtimeout > /dev/null 2>&1; then
    gtimeout 2s node "$HOME/bin/gsum-mcp-server/index.js" 2>&1 | grep -q "gsum MCP server running (v1.1.0 - optimized)"
elif command -v timeout > /dev/null 2>&1; then
    timeout 2s node "$HOME/bin/gsum-mcp-server/index.js" 2>&1 | grep -q "gsum MCP server running (v1.1.0 - optimized)"
else
    # Fallback for systems without timeout
    node "$HOME/bin/gsum-mcp-server/index.js" 2>&1 | head -n 10 | grep -q "gsum MCP server running (v1.1.0 - optimized)"
fi
grep_exit_code=$?
set -e

if [ $grep_exit_code -eq 0 ]; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    echo "  MCP server failed to start properly"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Summary
echo
echo "=================="
echo "Test Results:"
echo "  Tests run:    $TESTS_RUN"
echo "  Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo "  Failed:       ${RED}$TESTS_FAILED${NC}"
echo

if [ $TESTS_FAILED -eq 0 ]; then
    echo "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo "${RED}❌ Some tests failed${NC}"
    exit 1
fi