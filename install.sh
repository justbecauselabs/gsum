#!/bin/bash

# gsum CLI Installer
# https://github.com/jhurray/gsum

set -e

echo
echo "🤖 gsum CLI Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Check if this is an update
IS_UPDATE=false
if [ -f "$HOME/bin/gsum" ] || [ -f "$HOME/bin/smart-gsum" ]; then
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
    printf "${YELLOW}⚠️  Running in CI environment - skipping optional checks${NC}\\n"
fi

# Check for Git
if ! command -v git &> /dev/null; then
    printf "${RED}✗ Git not found. Please install git first.${NC}\n"
    exit 1
else
    printf "  ${GREEN}✓${NC} Git found\n"
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    printf "${RED}✗ Node.js not found. Please install Node.js first.${NC}\n"
    echo "   Download from: https://nodejs.org/"
    exit 1
else
    # Check Node version (require v16+)
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        printf "${YELLOW}⚠️  Node.js version is too old (v$NODE_VERSION)${NC}\n"
        echo "   gsum requires Node.js v16 or higher"
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

# Check for npm
if ! command -v npm &> /dev/null; then
    printf "${RED}✗ npm not found. Please install npm first.${NC}\n"
    echo "   npm should come with Node.js installation"
    exit 1
else
    printf "  ${GREEN}✓${NC} npm found\n"
fi

# Check for Gemini (optional but recommended)
if ! command -v gemini &> /dev/null; then
    printf "${YELLOW}⚠️  Gemini CLI not found${NC}\n"
    echo "   gsum works best with Gemini CLI installed"
    echo "   You can install it later if needed"
else
    printf "  ${GREEN}✓${NC} Gemini CLI found\n"
fi

# Create directories
echo
echo "📁 Creating directories..."
echo "━━━━━━━━━━━━━━━━━━━━━━"
mkdir -p "$HOME/bin"
printf "  ${GREEN}✓${NC} Directories created\n"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Install the CLI
echo
echo "📝 Installing gsum CLI..."
echo "━━━━━━━━━━━━━━━━━━━━━"

# Check if CLI directory exists
if [ ! -d "$SCRIPT_DIR/cli" ]; then
    printf "${RED}✗ CLI directory not found in $SCRIPT_DIR/${NC}\n"
    exit 1
fi

# Install npm dependencies
echo "  Installing dependencies..."
cd "$SCRIPT_DIR/cli"
npm install --silent

if [ -f "node_modules/commander/package.json" ]; then
    printf "  ${GREEN}✓${NC} Dependencies installed\n"
else
    printf "${RED}✗ Failed to install dependencies${NC}\n"
    exit 1
fi

# Create the gsum executable
echo "  Creating gsum executable..."
cat > "$HOME/bin/gsum" << 'EOF'
#!/bin/bash
# gsum CLI wrapper

# Get the directory where gsum is installed
GSUM_DIR="$(cd "$(dirname "$0")/../src/gsum/cli" 2>/dev/null && pwd)"
if [ -z "$GSUM_DIR" ] || [ ! -f "$GSUM_DIR/gsum.js" ]; then
    # Fallback locations
    for dir in "$HOME/src/gsum/cli" "$HOME/gsum/cli" "/opt/gsum/cli" "$(pwd)/cli" "$GITHUB_WORKSPACE/cli"; do
        if [ -f "$dir/gsum.js" ]; then
            GSUM_DIR="$dir"
            break
        fi
    done
fi

if [ -z "$GSUM_DIR" ] || [ ! -f "$GSUM_DIR/gsum.js" ]; then
    echo "Error: Could not find gsum installation"
    echo "Please reinstall gsum"
    exit 1
fi

# Execute the Node.js CLI
exec node "$GSUM_DIR/gsum.js" "$@"
EOF

chmod +x "$HOME/bin/gsum"
printf "  ${GREEN}✓${NC} Created gsum executable\n"

# Test the installation
echo "  Testing installation..."
if "$HOME/bin/gsum" version > /dev/null 2>&1; then
    printf "  ${GREEN}✓${NC} gsum CLI is working\n"
    
    # Additional verification
    echo "  Verifying installation path..."
    GSUM_PATH=$(which gsum 2>/dev/null || echo "")
    if [ -n "$GSUM_PATH" ]; then
        printf "  ${GREEN}✓${NC} gsum found at: $GSUM_PATH\n"
    else
        printf "  ${YELLOW}⚠️${NC} gsum not in PATH yet (will be after shell reload)\n"
    fi
    
    # Show version
    GSUM_VERSION=$("$HOME/bin/gsum" --version 2>/dev/null || echo "unknown")
    printf "  ${GREEN}✓${NC} Version: $GSUM_VERSION\n"
else
    printf "${RED}✗ gsum CLI test failed${NC}\n"
    echo "   Please check the installation"
    exit 1
fi

# Add ~/bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    echo
    echo "🔧 Configuring shell PATH..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "" >> "$SHELL_RC"
    echo "# Add local bin to PATH for gsum" >> "$SHELL_RC"
    echo 'export PATH="$HOME/bin:$PATH"' >> "$SHELL_RC"
    printf "  ${GREEN}✓${NC} Added ~/bin to PATH\n"
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
    echo "  2. Start using gsum!"
else
    echo "  • gsum has been updated to the latest version!"
fi
echo
echo "🤖 Available Commands:"
echo "───────────────────────"
printf "  ${YELLOW}gsum${NC}              - Generate ephemeral project summary\n"
printf "  ${YELLOW}gsum save${NC}         - Create/update persistent ARCHITECTURE.gsum.md\n"
printf "  ${YELLOW}gsum plan <task>${NC}  - Generate implementation plan for a task\n"
printf "  ${YELLOW}gsum update${NC}       - Update gsum to the latest version\n"
printf "  ${YELLOW}gsum --help${NC}       - Show all options and commands\n"
echo
echo "💡 Examples:"
echo "  gsum                     # Summarize current directory"
echo "  gsum -v                  # Verbose output"
echo "  gsum save --force        # Force regenerate saved summary"
echo '  gsum plan "add auth"     # Plan authentication feature'
echo "  gsum update              # Update to latest version"
echo
echo "📝 Optional: Install Claude commands"
echo "  Run 'make install-commands' to add /gsum commands to Claude"
echo
echo
echo "Happy coding! 🚀"
echo