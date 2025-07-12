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

echo "${GREEN}✓${NC} All prerequisites found"
echo

# Create mock gemini if needed
MOCK_CREATED=false
if ! command -v gemini &> /dev/null; then
    echo "${YELLOW}⚠️  Gemini not found, creating mock for testing${NC}"
    
    # Backup existing gemini if it exists
    if [ -f "$HOME/bin/gemini" ]; then
        mv "$HOME/bin/gemini" "$HOME/bin/gemini.mock"
    fi
    
    # Create mock gemini
    cat > "$HOME/bin/gemini" << 'EOF'
#!/bin/bash
# Mock gemini for testing

# Simple mock that creates a directory summary when called with --yolo
if [[ "$*" == *"--yolo"* ]]; then
    # Read from stdin to consume the heredoc
    cat > /dev/null
    
    # Smart-gsum calls gsummarize-wrapper which changes to target directory
    # So we're already in the right directory, just create the file
    cat > DIRECTORY_SUMMARY.md << 'EOFSUM'
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
    
    echo "Mock Gemini: Created DIRECTORY_SUMMARY.md"
fi
EOF
    chmod +x "$HOME/bin/gemini"
    MOCK_CREATED=true
fi

# Create test environment
echo
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
DIRECTORY_SUMMARY*.md
EOF

# Initial commit
git add -A
git commit -m "Initial commit" --quiet

echo "${GREEN}✓${NC} Test environment ready"
echo

# Run tests
echo "Running tests..."
echo

# Test 1: First run should generate summary
echo "=== Test 1: First run ==="
run_test "First run generates summary" \
    "$HOME/bin/smart-gsum ." \
    "No existing summary found"

# Verify file was created
echo -n "Verifying DIRECTORY_SUMMARY.md exists... "
if [ -f "DIRECTORY_SUMMARY.md" ]; then
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
echo -n "Verifying git hash in summary... "
if [ -f "DIRECTORY_SUMMARY.md" ] && grep -q "<!-- git-hash:" "DIRECTORY_SUMMARY.md"; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    if [ -f "DIRECTORY_SUMMARY.md" ]; then
        echo "  Last 5 lines of summary:"
        tail -5 DIRECTORY_SUMMARY.md | sed 's/^/    /'
    fi
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 2: No changes should load cached
echo
echo "=== Test 2: No changes ==="
sleep 1  # Ensure different timestamp
run_test "No changes loads cached summary" \
    "$HOME/bin/smart-gsum ." \
    "Summary is up to date"

# Test 3: Minor changes should show diff
echo
echo "=== Test 3: Minor changes ==="
echo "// New comment" >> src/components/Button.js
git add -A
git commit -m "Add comment" --quiet

run_test "Minor changes show diff" \
    "$HOME/bin/smart-gsum ." \
    "Changes are trivial"

# Test 4: Major changes should regenerate
echo
echo "=== Test 4: Major changes ==="

# For testing, we'll modify the existing file significantly
# First, let's save the current state
cp src/components/Button.js src/components/Button.js.bak

# Replace with much larger content (100+ lines)
cat > src/components/Button.js << 'EOFLARGE'
import React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// Button component with many features
export function Button({ 
    label, 
    onClick, 
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon = null,
    tooltip = '',
    ariaLabel = '',
    className = '',
    style = {},
    children,
    ...rest 
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    
    // Track button analytics
    useEffect(() => {
        if (clickCount > 0) {
            console.log(`Button clicked ${clickCount} times`);
        }
    }, [clickCount]);
    
    // Handle click with analytics
    const handleClick = useCallback((e) => {
        if (disabled || loading) return;
        
        setClickCount(prev => prev + 1);
        
        if (onClick) {
            onClick(e);
        }
    }, [disabled, loading, onClick]);
    
    // Compute button classes
    const buttonClasses = useMemo(() => {
        const classes = ['button'];
        
        classes.push(`button--${variant}`);
        classes.push(`button--${size}`);
        
        if (disabled) classes.push('button--disabled');
        if (loading) classes.push('button--loading');
        if (isHovered) classes.push('button--hovered');
        if (isPressed) classes.push('button--pressed');
        
        if (className) classes.push(className);
        
        return classes.join(' ');
    }, [variant, size, disabled, loading, isHovered, isPressed, className]);
    
    // Render loading spinner
    const renderSpinner = () => (
        <span className="button__spinner">
            <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
        </span>
    );
    
    // Render icon
    const renderIcon = () => {
        if (!icon) return null;
        
        return <span className="button__icon">{icon}</span>;
    };
    
    return (
        <button
            className={buttonClasses}
            onClick={handleClick}
            disabled={disabled || loading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            aria-label={ariaLabel || label}
            title={tooltip}
            style={style}
            {...rest}
        >
            {loading && renderSpinner()}
            {!loading && renderIcon()}
            <span className="button__label">
                {children || label}
            </span>
        </button>
    );
}

Button.propTypes = {
    label: PropTypes.string,
    onClick: PropTypes.func,
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'warning']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    icon: PropTypes.node,
    tooltip: PropTypes.string,
    ariaLabel: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    children: PropTypes.node,
};

// Export additional button variants
export const PrimaryButton = (props) => <Button {...props} variant="primary" />;
export const SecondaryButton = (props) => <Button {...props} variant="secondary" />;
export const DangerButton = (props) => <Button {...props} variant="danger" />;
export const SuccessButton = (props) => <Button {...props} variant="success" />;
export const WarningButton = (props) => <Button {...props} variant="warning" />;

// Button group component
export function ButtonGroup({ children, className = '', ...props }) {
    return (
        <div className={`button-group ${className}`} {...props}>
            {children}
        </div>
    );
}

ButtonGroup.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

// Export everything
export default Button;
EOFLARGE

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

run_test "Major changes trigger regeneration" \
    "$HOME/bin/smart-gsum ." \
    "Significant changes detected"

# Test 5: Branch handling
echo
echo "=== Test 5: Branch handling ==="

# First ensure we have a main branch summary
git checkout main --quiet
# The summary should already exist from previous tests

# Now create and switch to feature branch
git checkout -b feature-branch --quiet

# Make a change on the new branch
echo "export const VERSION = '2.0.0';" > src/version.js
git add -A
git commit -m "Add version file" --quiet

# Should create branch-specific file since we're on a different branch
run_test "New branch creates branch-specific file" \
    "$HOME/bin/smart-gsum ." \
    "No existing summary found"

# Verify branch-specific file exists
echo -n "Verifying branch-specific summary... "
if [ -f "DIRECTORY_SUMMARY.feature-branch.md" ]; then
    echo "${GREEN}✓ PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo "${RED}✗ FAILED${NC}"
    echo "  Looking for: DIRECTORY_SUMMARY.feature-branch.md"
    echo "  Files found:"
    ls -la DIRECTORY_SUMMARY*.md 2>/dev/null | sed 's/^/    /' || echo "    No DIRECTORY_SUMMARY files found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 6: Non-git directory
echo
echo "=== Test 6: Non-git directory ==="
NON_GIT_DIR="$TEST_DIR/non-git"
mkdir -p "$NON_GIT_DIR"
echo "Some content" > "$NON_GIT_DIR/file.txt"
cd "$NON_GIT_DIR"

run_test "Non-git directory generates summary" \
    "$HOME/bin/smart-gsum ." \
    "Not a git repository"

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