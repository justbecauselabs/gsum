---
description: Creates or updates a persistent, version-controlled ARCHITECTURE.gsum.md file.
allowed-tools: [bash, Read, Write, Grep, Glob, LS]
---

# Debug logging
echo "🔍 Running /gsum-save command..."
echo "Working directory: $(pwd)"
echo "Arguments: $ARGUMENTS"

# Check if smart-gsum exists
if ! command -v smart-gsum >/dev/null 2>&1; then
    echo "❌ ERROR: smart-gsum command not found in PATH"
    echo "PATH is: $PATH"
    echo "Looking for smart-gsum in common locations..."
    find ~/bin /usr/local/bin ~/.local/bin -name "smart-gsum" -type f 2>/dev/null || echo "Not found in common locations"
    exit 1
fi

# Run the actual command with debug logging
echo "✅ Found smart-gsum at: $(command -v smart-gsum)"
echo "📝 Creating debug log..."
gsum-debug-wrapper gsum-save $ARGUMENTS

# If debug wrapper fails, fall back to direct execution
if [ $? -ne 0 ]; then
    echo "⚠️ Debug wrapper failed, trying direct execution..."
    smart-gsum --save $ARGUMENTS
fi