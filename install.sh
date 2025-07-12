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
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
RED=$'\033[0;31m'
NC=$'\033[0m' # No Color

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

echo "  📍 Detected shell: $SHELL_NAME"

# Check prerequisites
echo
echo "📋 Checking prerequisites..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━"

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

# Check for Node.js (required for MCP server)
if ! command -v node &> /dev/null; then
    echo "${RED}✗ Node.js not found. Please install Node.js first.${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
else
    # Check Node version (require v18+)
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo "${YELLOW}⚠️  Node.js version is too old (v$NODE_VERSION)${NC}"
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
        echo "${GREEN}✓${NC} Node.js found (v$NODE_VERSION)"
    fi
fi

# Check for npm (required for MCP server dependencies)
if ! command -v npm &> /dev/null; then
    echo "${RED}✗ npm not found. Please install npm first.${NC}"
    echo "   npm should come with Node.js installation"
    exit 1
else
    echo "${GREEN}✓${NC} npm found"
fi

# Create directories
echo
echo "📁 Creating directories..."
echo "━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p "$HOME/bin"
mkdir -p "$HOME/.claude/commands"
echo "${GREEN}✓${NC} Directories created"

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

# Copy Claude commands
if [ -f "$SCRIPT_DIR/claude-commands/gsum.md" ]; then
    cp "$SCRIPT_DIR/claude-commands/gsum.md" "$HOME/.claude/commands/"
    echo "${GREEN}✓${NC} Installed Claude /gsum command"
else
    echo "${RED}✗ gsum.md not found in $SCRIPT_DIR/claude-commands/${NC}"
    exit 1
fi

if [ -f "$SCRIPT_DIR/claude-commands/gsum-save.md" ]; then
    cp "$SCRIPT_DIR/claude-commands/gsum-save.md" "$HOME/.claude/commands/"
    echo "${GREEN}✓${NC} Installed Claude /gsum-save command"
else
    echo "${RED}✗ gsum-save.md not found in $SCRIPT_DIR/claude-commands/${NC}"
    exit 1
fi

if [ -f "$SCRIPT_DIR/claude-commands/gsum-plan.md" ]; then
    cp "$SCRIPT_DIR/claude-commands/gsum-plan.md" "$HOME/.claude/commands/"
    echo "${GREEN}✓${NC} Installed Claude /gsum-plan command"
else
    echo "${RED}✗ gsum-plan.md not found in $SCRIPT_DIR/claude-commands/${NC}"
    exit 1
fi

# Install MCP server
echo
echo "🖥️  Installing MCP server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$SCRIPT_DIR/mcp-server" ]; then
    cp -r "$SCRIPT_DIR/mcp-server" "$HOME/bin/gsum-mcp-server"
    chmod +x "$HOME/bin/gsum-mcp-server/index.js"
    echo "${GREEN}✓${NC} Copied MCP server files"
    
    # Install npm dependencies
    if command -v npm &> /dev/null; then
        echo "Installing MCP server dependencies..."
        cd "$HOME/bin/gsum-mcp-server"
        npm install --silent
        
        # Validate installation
        if [ -f "node_modules/@modelcontextprotocol/sdk/package.json" ]; then
            echo "${GREEN}✓${NC} Installed MCP server dependencies"
        else
            echo "${RED}✗ Failed to install MCP server dependencies${NC}"
            echo "   Try running: cd ~/bin/gsum-mcp-server && npm install"
            exit 1
        fi
        cd - > /dev/null
    else
        echo "${YELLOW}⚠️  npm not found - MCP server dependencies not installed${NC}"
        echo "   Run 'cd ~/bin/gsum-mcp-server && npm install' after installing npm"
    fi
    
    # Validate MCP server can run
    echo "Validating MCP server..."
    if node "$HOME/bin/gsum-mcp-server/index.js" --version > /dev/null 2>&1; then
        echo "${GREEN}✓${NC} MCP server validated"
    else
        echo "${YELLOW}⚠️  Could not validate MCP server${NC}"
        echo "   The server may still work when called by Gemini"
    fi
else
    echo "${RED}✗ MCP server directory not found in $SCRIPT_DIR/${NC}"
    exit 1
fi

# Add aliases to shell RC
echo
echo "🔧 Configuring shell aliases..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

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
    echo "${YELLOW}⚠️  Existing Gemini config found${NC}"
    
    # Check if gsum MCP server is already configured
    if grep -q "gsum-mcp-server" "$GEMINI_CONFIG_FILE" 2>/dev/null; then
        echo "${GREEN}✓${NC} gsum MCP server already configured in Gemini"
    else
        echo "Adding gsum MCP server to existing Gemini config..."
        
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
                echo "${GREEN}✓${NC} Successfully updated Gemini config"
            else
                echo "${RED}✗ Failed to update Gemini config${NC}"
                echo "   Please manually add the MCP server to $GEMINI_CONFIG_FILE"
            fi
        else
            echo "${YELLOW}⚠️  Python not found - cannot automatically update Gemini config${NC}"
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
    echo "Creating new Gemini config..."
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
    echo "${GREEN}✓${NC} Created Gemini config with gsum MCP server"
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
    echo "2. Restart Gemini CLI to load the new MCP server"
    echo "3. In Claude, try the new commands!"
else
    echo "- Your Claude commands have been updated!"
    echo "- Restart Gemini CLI to load any MCP server updates"
fi
echo
echo "Available Claude Commands:"
echo "  ${YELLOW}/gsum${NC}              - Generate ephemeral project summary (always fresh)"
echo "  ${YELLOW}/gsum-save${NC}         - Create/update persistent ARCHITECTURE.gsum.md"
echo "  ${YELLOW}/gsum-plan${NC} \"task\"  - Generate implementation plan for a task"
echo
echo "MCP Server Status:"
echo "  ${GREEN}✓${NC} gsum MCP server installed at: ~/bin/gsum-mcp-server"
echo "  ${GREEN}✓${NC} Configured in Gemini settings"
echo
echo "Examples:"
echo "  /gsum                    # Summarize current directory"
echo "  /gsum ./src              # Summarize specific directory"
echo "  /gsum-save               # Create ARCHITECTURE.gsum.md in current dir"
echo "  /gsum-plan \"Add user authentication feature\""
echo
echo "Happy coding! 🚀"