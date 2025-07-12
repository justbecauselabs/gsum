#!/bin/bash

# AI Context Summarizer - One-command installer
# https://github.com/jhurray/ai-context-summarizer

set -e

echo "🤖 AI Context Summarizer Installer"
echo "=================================="
echo

# Check if this is an update
IS_UPDATE=false
if [ -f "$HOME/bin/smart-gsum" ] || [ -f "$HOME/bin/gsummarize-wrapper" ]; then
    IS_UPDATE=true
    echo "📦 Detected existing installation - updating..."
else
    echo "🚀 Installing gsum for the first time..."
fi
echo

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
    SHELL_NAME="bash"
else
    echo "${RED}Error: Unsupported shell. Please use bash or zsh.${NC}"
    exit 1
fi

echo "📍 Detected shell: $SHELL_NAME"

# Check prerequisites
echo
echo "Checking prerequisites..."

# Check if running in CI
if [ -n "$CI" ]; then
    echo "${YELLOW}⚠️  Running in CI environment - skipping prerequisite checks${NC}"
else
    # Check for Claude
    if ! command -v claude &> /dev/null; then
        echo "${YELLOW}⚠️  Claude CLI not found${NC}"
        echo "   Please install Claude Desktop and the CLI first:"
        echo "   https://claude.ai/download"
        echo
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "${GREEN}✓${NC} Claude CLI found"
    fi

    # Check for Gemini
    if ! command -v gemini &> /dev/null; then
        echo "${YELLOW}⚠️  Gemini CLI not found${NC}"
        echo "   Please install Gemini CLI with MCP support first"
        echo
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "${GREEN}✓${NC} Gemini CLI found"
    fi
fi

# Check for Git
if ! command -v git &> /dev/null; then
    echo "${RED}✗ Git not found. Please install git first.${NC}"
    exit 1
else
    echo "${GREEN}✓${NC} Git found"
fi

# Create directories
echo
echo "Creating directories..."
mkdir -p "$HOME/bin"
mkdir -p "$HOME/.claude/commands"
echo "${GREEN}✓${NC} Directories created"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Copy scripts
echo
echo "Installing scripts..."

# Copy smart-gsum
if [ -f "$SCRIPT_DIR/bin/smart-gsum" ]; then
    cp "$SCRIPT_DIR/bin/smart-gsum" "$HOME/bin/"
    chmod +x "$HOME/bin/smart-gsum"
    echo "${GREEN}✓${NC} Installed smart-gsum"
else
    echo "${RED}✗ smart-gsum not found in $SCRIPT_DIR/bin/${NC}"
    exit 1
fi

# Copy gsummarize-wrapper
if [ -f "$SCRIPT_DIR/bin/gsummarize-wrapper" ]; then
    cp "$SCRIPT_DIR/bin/gsummarize-wrapper" "$HOME/bin/"
    chmod +x "$HOME/bin/gsummarize-wrapper"
    echo "${GREEN}✓${NC} Installed gsummarize-wrapper"
else
    echo "${RED}✗ gsummarize-wrapper not found in $SCRIPT_DIR/bin/${NC}"
    exit 1
fi

# Copy Claude command
if [ -f "$SCRIPT_DIR/claude-commands/gsum.md" ]; then
    cp "$SCRIPT_DIR/claude-commands/gsum.md" "$HOME/.claude/commands/"
    echo "${GREEN}✓${NC} Installed Claude /gsum command"
else
    echo "${RED}✗ gsum.md not found in $SCRIPT_DIR/claude-commands/${NC}"
    exit 1
fi

# Add aliases to shell RC
echo
echo "Configuring shell aliases..."

# Check if aliases already exist
if grep -q "alias gyolo=" "$SHELL_RC" 2>/dev/null; then
    echo "${YELLOW}⚠️  gyolo alias already exists in $SHELL_RC${NC}"
else
    echo "" >> "$SHELL_RC"
    echo "# AI Context Summarizer aliases" >> "$SHELL_RC"
    echo 'alias gyolo="gemini --yolo"' >> "$SHELL_RC"
    echo "${GREEN}✓${NC} Added gyolo alias"
fi

if grep -q "alias gsummarize=" "$SHELL_RC" 2>/dev/null; then
    echo "${YELLOW}⚠️  gsummarize alias already exists in $SHELL_RC${NC}"
else
    echo 'alias gsummarize="~/bin/gsummarize-wrapper"' >> "$SHELL_RC"
    echo "${GREEN}✓${NC} Added gsummarize alias"
fi

# Add ~/bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo "" >> "$SHELL_RC"
    echo "# Add local bin to PATH" >> "$SHELL_RC"
    echo 'export PATH="$HOME/bin:$PATH"' >> "$SHELL_RC"
    echo "${GREEN}✓${NC} Added ~/bin to PATH"
else
    echo "${GREEN}✓${NC} ~/bin already in PATH"
fi

# Success message
echo
if [ "$IS_UPDATE" = true ]; then
    echo "🎉 ${GREEN}Update complete!${NC}"
else
    echo "🎉 ${GREEN}Installation complete!${NC}"
fi
echo
echo "Next steps:"
if [ "$IS_UPDATE" = false ]; then
    echo "1. Reload your shell: ${YELLOW}source $SHELL_RC${NC}"
    echo "2. In Claude, type: ${YELLOW}/gsum${NC}"
else
    echo "- In Claude, type: ${YELLOW}/gsum${NC}"
fi
echo
echo "Usage:"
echo "  /gsum              - Analyze current directory"
echo "  /gsum /path/to/dir - Analyze specific directory"
echo
if [ "$IS_UPDATE" = false ]; then
    echo "The first run will generate a detailed architecture document."
    echo "Subsequent runs will be smart about regeneration."
fi
echo
echo "Happy coding! 🚀"