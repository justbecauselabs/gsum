#!/bin/bash

# AI Context Summarizer - One-command installer
# https://github.com/jhurray/ai-context-summarizer

set -e

echo
echo "🤖 AI Context Summarizer Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Check if this is an update
IS_UPDATE=false
if [ -f "$HOME/bin/smart-gsum" ] || [ -f "$HOME/bin/gsummarize-wrapper" ]; then
    IS_UPDATE=true
    echo "  📦 Detected existing installation - updating..."
else
    echo "  🚀 Installing gsum for the first time..."
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
    printf "${RED}Error: Unsupported shell. Please use bash or zsh.${NC}\n"
    exit 1
fi

echo "  📍 Detected shell: $SHELL_NAME"

# Check prerequisites
echo
echo "📋 Checking prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if running in CI
if [ -n "$CI" ]; then
    printf "${YELLOW}⚠️  Running in CI environment - skipping prerequisite checks${NC}\\n"
else
    # Check for Claude
    if ! command -v claude &> /dev/null; then
        printf "${YELLOW}⚠️  Claude CLI not found${NC}\n"
        echo "   Please install Claude Desktop and the CLI first:"
        echo "   https://claude.ai/download"
        echo
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        printf "  ${GREEN}✓${NC} Claude CLI found\n"
    fi

    # Check for Gemini
    if ! command -v gemini &> /dev/null; then
        printf "${YELLOW}⚠️  Gemini CLI not found${NC}\n"
        echo "   Please install Gemini CLI with MCP support first"
        echo
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        # Validate it's the real Gemini CLI, not a mock
        GEMINI_PATH=$(which gemini)
        if [ -f "$GEMINI_PATH" ]; then
            # Check if it's a shell script that might be a mock
            if file "$GEMINI_PATH" | grep -q "shell script"; then
                # Check for mock patterns
                if grep -q "mock\|test\|DIRECTORY_SUMMARY\.md" "$GEMINI_PATH" 2>/dev/null; then
                    printf "${RED}✗ Found mock/test gemini script at: $GEMINI_PATH${NC}\n"
                    echo "   This appears to be a test script, not the real Gemini CLI"
                    
                    # Look for real Gemini CLI
                    REAL_GEMINI=""
                    for path in /opt/homebrew/bin/gemini /usr/local/bin/gemini ~/.local/bin/gemini; do
                        if [ -f "$path" ] && file "$path" | grep -q "Node.js"; then
                            REAL_GEMINI="$path"
                            break
                        fi
                    done
                    
                    if [ -n "$REAL_GEMINI" ]; then
                        echo "   Found real Gemini CLI at: $REAL_GEMINI"
                        echo "   Please remove the mock script: rm $GEMINI_PATH"
                        echo "   Or rename it: mv $GEMINI_PATH ${GEMINI_PATH}.mock"
                    else
                        echo "   Please install the real Gemini CLI from:"
                        echo "   https://github.com/google/generative-ai-docs/tree/main/gemini-cli"
                    fi
                    exit 1
                fi
            fi
            
            # Additional validation - check if gemini has expected behavior
            if ! gemini --version 2>&1 | grep -q -E "(gemini|version|Gemini)" > /dev/null 2>&1; then
                printf "${YELLOW}⚠️  Gemini CLI found but may not be properly installed${NC}\n"
                echo "   Path: $GEMINI_PATH"
                echo "   Could not validate version information"
            else
                printf "  ${GREEN}✓${NC} Gemini CLI found and validated\n"
            fi
        else
            printf "  ${GREEN}✓${NC} Gemini CLI found\n"
        fi
    fi
fi

# Check for Git
if ! command -v git &> /dev/null; then
    printf "${RED}✗ Git not found. Please install git first.${NC}\n"
    exit 1
else
    printf "  ${GREEN}✓${NC} Git found\n"
fi

# Check for Node.js (required for MCP server)
if ! command -v node &> /dev/null; then
    printf "${RED}✗ Node.js not found. Please install Node.js first.${NC}\n"
    echo "   Download from: https://nodejs.org/"
    exit 1
else
    # Check Node version (require v18+)
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        printf "${YELLOW}⚠️  Node.js version is too old (v$NODE_VERSION)${NC}\n"
        echo "   gsum MCP server requires Node.js v18 or higher"
        echo "   Please update Node.js: https://nodejs.org/"
        if [ -z "$CI" ]; then
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        printf "  ${GREEN}✓${NC} Node.js found (v$NODE_VERSION)\n"
    fi
fi

# Check for npm (required for MCP server dependencies)
if ! command -v npm &> /dev/null; then
    printf "${RED}✗ npm not found. Please install npm first.${NC}\n"
    echo "   npm should come with Node.js installation"
    exit 1
else
    printf "  ${GREEN}✓${NC} npm found\n"
fi

# Create directories
echo
echo "📁 Creating directories..."
echo "━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p "$HOME/bin"
mkdir -p "$HOME/.claude/commands"
printf "  ${GREEN}✓${NC} Directories created\n"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Copy scripts
echo
echo "📝 Installing scripts..."
echo "━━━━━━━━━━━━━━━━━━━━━"

# Copy smart-gsum
if [ -f "$SCRIPT_DIR/bin/smart-gsum" ]; then
    cp "$SCRIPT_DIR/bin/smart-gsum" "$HOME/bin/"
    chmod +x "$HOME/bin/smart-gsum"
    printf "  ${GREEN}✓${NC} Installed smart-gsum\n"
else
    printf "${RED}✗ smart-gsum not found in $SCRIPT_DIR/bin/${NC}\n"
    exit 1
fi

# Copy gsummarize-wrapper
if [ -f "$SCRIPT_DIR/bin/gsummarize-wrapper" ]; then
    cp "$SCRIPT_DIR/bin/gsummarize-wrapper" "$HOME/bin/"
    chmod +x "$HOME/bin/gsummarize-wrapper"
    printf "  ${GREEN}✓${NC} Installed gsummarize-wrapper\n"
else
    printf "${RED}✗ gsummarize-wrapper not found in $SCRIPT_DIR/bin/${NC}\n"
    exit 1
fi

# Copy Claude commands
if [ -f "$SCRIPT_DIR/claude-commands/gsum.md" ]; then
    cp "$SCRIPT_DIR/claude-commands/gsum.md" "$HOME/.claude/commands/"
    printf "  ${GREEN}✓${NC} Installed Claude /gsum command\n"
else
    printf "${RED}✗ gsum.md not found in $SCRIPT_DIR/claude-commands/${NC}\n"
    exit 1
fi

if [ -f "$SCRIPT_DIR/claude-commands/gsum-save.md" ]; then
    cp "$SCRIPT_DIR/claude-commands/gsum-save.md" "$HOME/.claude/commands/"
    printf "  ${GREEN}✓${NC} Installed Claude /gsum-save command\n"
else
    printf "${RED}✗ gsum-save.md not found in $SCRIPT_DIR/claude-commands/${NC}\n"
    exit 1
fi

if [ -f "$SCRIPT_DIR/claude-commands/gsum-plan.md" ]; then
    cp "$SCRIPT_DIR/claude-commands/gsum-plan.md" "$HOME/.claude/commands/"
    printf "  ${GREEN}✓${NC} Installed Claude /gsum-plan command\n"
else
    printf "${RED}✗ gsum-plan.md not found in $SCRIPT_DIR/claude-commands/${NC}\n"
    exit 1
fi

# Install MCP server
echo
echo "🖥️  Installing MCP server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$SCRIPT_DIR/mcp-server" ]; then
    mkdir -p "$HOME/bin/gsum-mcp-server"
    cp "$SCRIPT_DIR/mcp-server/index.js" "$HOME/bin/gsum-mcp-server/"
    cp "$SCRIPT_DIR/mcp-server/package.json" "$HOME/bin/gsum-mcp-server/"
    if [ -d "$SCRIPT_DIR/mcp-server/test" ]; then
        cp -r "$SCRIPT_DIR/mcp-server/test" "$HOME/bin/gsum-mcp-server/"
    fi
    chmod +x "$HOME/bin/gsum-mcp-server/index.js"
    printf "  ${GREEN}✓${NC} Copied MCP server files\n"
    
    # Install npm dependencies
    if command -v npm &> /dev/null; then
        echo "  Installing MCP server dependencies..."
        cd "$HOME/bin/gsum-mcp-server"
        npm install --silent
        
        # Validate installation
        if [ -f "node_modules/@modelcontextprotocol/sdk/package.json" ]; then
            printf "  ${GREEN}✓${NC} Installed MCP server dependencies\n"
        else
            printf "${RED}✗ Failed to install MCP server dependencies${NC}\n"
            echo "   Try running: cd ~/bin/gsum-mcp-server && npm install"
            exit 1
        fi
        cd - > /dev/null
    else
        printf "${YELLOW}⚠️  npm not found - MCP server dependencies not installed${NC}\n"
        echo "   Run 'cd ~/bin/gsum-mcp-server && npm install' after installing npm"
    fi
    
    # Validate MCP server can run
    echo "  Validating MCP server..."
    if node "$HOME/bin/gsum-mcp-server/index.js" --version > /dev/null 2>&1; then
        printf "  ${GREEN}✓${NC} MCP server validated\n"
    else
        printf "${YELLOW}⚠️  Could not validate MCP server${NC}\n"
        echo "   The server may still work when called by Gemini"
    fi
else
    printf "${RED}✗ MCP server directory not found in $SCRIPT_DIR/${NC}\n"
    exit 1
fi

# Add aliases to shell RC
echo
echo "🔧 Configuring shell aliases..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if aliases already exist
if grep -q "alias gyolo=" "$SHELL_RC" 2>/dev/null; then
    printf "${YELLOW}⚠️  gyolo alias already exists in $SHELL_RC${NC}\n"
else
    echo "" >> "$SHELL_RC"
    echo "# AI Context Summarizer aliases" >> "$SHELL_RC"
    echo 'alias gyolo="gemini --yolo"' >> "$SHELL_RC"
    printf "  ${GREEN}✓${NC} Added gyolo alias\n"
fi

if grep -q "alias gsummarize=" "$SHELL_RC" 2>/dev/null; then
    printf "${YELLOW}⚠️  gsummarize alias already exists in $SHELL_RC${NC}\n"
else
    echo 'alias gsummarize="~/bin/gsummarize-wrapper"' >> "$SHELL_RC"
    printf "  ${GREEN}✓${NC} Added gsummarize alias\n"
fi

# Add ~/bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo "" >> "$SHELL_RC"
    echo "# Add local bin to PATH" >> "$SHELL_RC"
    echo 'export PATH="$HOME/bin:$PATH"' >> "$SHELL_RC"
    printf "  ${GREEN}✓${NC} Added ~/bin to PATH\n"
else
    printf "  ${GREEN}✓${NC} ~/bin already in PATH\n"
fi

# Configure Gemini MCP settings
echo
echo "⚙️  Configuring Gemini MCP settings..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

GEMINI_CONFIG_DIR="$HOME/.config/gemini"
GEMINI_CONFIG_FILE="$GEMINI_CONFIG_DIR/config.json"

# Create config directory if it doesn't exist
mkdir -p "$GEMINI_CONFIG_DIR"

# Check if config file exists
if [ -f "$GEMINI_CONFIG_FILE" ]; then
    printf "${YELLOW}⚠️  Existing Gemini config found${NC}\n"
    
    # Check if gsum MCP server is already configured
    if grep -q "gsum-mcp-server" "$GEMINI_CONFIG_FILE" 2>/dev/null; then
        printf "  ${GREEN}✓${NC} gsum MCP server already configured in Gemini\n"
    else
        echo "  Adding gsum MCP server to existing Gemini config..."
        
        # Create backup
        cp "$GEMINI_CONFIG_FILE" "$GEMINI_CONFIG_FILE.backup"
        
        # Use Python to safely modify JSON (if available)
        if command -v python3 &> /dev/null; then
            python3 -c "
import json
import sys

config_file = '$GEMINI_CONFIG_FILE'

try:
    with open(config_file, 'r') as f:
        config = json.load(f)
except:
    config = {}

# Ensure mcpServers exists
if 'mcpServers' not in config:
    config['mcpServers'] = {}

# Add gsum MCP server
config['mcpServers']['gsum'] = {
    'command': 'node',
    'args': ['$HOME/bin/gsum-mcp-server/index.js'],
    'description': 'gsum directory summarization tool'
}

# Write back
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print('✓ Added gsum MCP server to Gemini config')
"
            if [ $? -eq 0 ]; then
                printf "  ${GREEN}✓${NC} Successfully updated Gemini config\n"
            else
                printf "${RED}✗ Failed to update Gemini config${NC}\n"
                echo "   Please manually add the MCP server to $GEMINI_CONFIG_FILE"
            fi
        else
            printf "${YELLOW}⚠️  Python not found - cannot automatically update Gemini config${NC}\n"
            echo "   Please manually add the following to your Gemini config at $GEMINI_CONFIG_FILE:"
            echo
            echo '   "mcpServers": {'
            echo '     "gsum": {'
            echo '       "command": "node",'
            echo "       \"args\": [\"$HOME/bin/gsum-mcp-server/index.js\"],"
            echo '       "description": "gsum directory summarization tool"'
            echo '     }'
            echo '   }'
        fi
    fi
else
    # Create new config file
    echo "  Creating new Gemini config..."
    cat > "$GEMINI_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "gsum": {
      "command": "node",
      "args": ["$HOME/bin/gsum-mcp-server/index.js"],
      "description": "gsum directory summarization tool"
    }
  }
}
EOF
    printf "  ${GREEN}✓${NC} Created Gemini config with gsum MCP server\n"
fi

# Success message
echo
echo
if [ "$IS_UPDATE" = true ]; then
    printf "🎉 ${GREEN}Update complete!${NC}\n"
else
    printf "🎉 ${GREEN}Installation complete!${NC}\n"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📋 Next steps:"
if [ "$IS_UPDATE" = false ]; then
    printf "  1. Reload your shell: ${YELLOW}source $SHELL_RC${NC}\n"
    echo "  2. Restart Gemini CLI to load the new MCP server"
    echo "  3. In Claude, try the new commands!"
else
    echo "  • Your Claude commands have been updated!"
    echo "  • Restart Gemini CLI to load any MCP server updates"
fi
echo
echo "🤖 Available Claude Commands:"
echo "────────────────────────────"
printf "  ${YELLOW}/gsum${NC}              - Generate ephemeral project summary (always fresh)\n"
printf "  ${YELLOW}/gsum-save${NC}         - Create/update persistent ARCHITECTURE.gsum.md\n"
printf "  ${YELLOW}/gsum-plan${NC} \"task\"  - Generate implementation plan for a task\n"
echo
echo "📡 MCP Server Status:"
echo "────────────────────"
printf "  ${GREEN}✓${NC} gsum MCP server installed at: ~/bin/gsum-mcp-server\n"
printf "  ${GREEN}✓${NC} Configured in Gemini settings\n"
echo
echo "💡 Examples:"
echo "  /gsum                    # Summarize current directory"
echo "  /gsum ./src              # Summarize specific directory"
echo "  /gsum-save               # Create ARCHITECTURE.gsum.md in current dir"
echo "  /gsum-plan \"Add user authentication feature\""
echo
echo
echo "Happy coding! 🚀"
echo