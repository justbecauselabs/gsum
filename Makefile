.PHONY: install update test help

# Default target
help:
	@echo "gsum - Smart AI Context Summarizer"
	@echo ""
	@echo "Available commands:"
	@echo "  make install  - Install or update gsum"
	@echo "  make update   - Update to latest version from GitHub"
	@echo "  make test     - Run test suite"
	@echo "  make help     - Show this help message"

# Install or update
install:
	@echo "🚀 Installing/updating gsum..."
	@./install.sh

# Update to latest version
update:
	@echo "📦 Updating gsum to latest version..."
	@echo ""
	
	# Create temp directory
	@mkdir -p /tmp/gsum-update
	
	# Clone latest version
	@echo "⬇️  Downloading latest version..."
	@git clone --quiet https://github.com/jhurray/gsum.git /tmp/gsum-update/gsum 2>/dev/null || \
		(cd /tmp/gsum-update/gsum && git pull --quiet origin main)
	
	# Copy files
	@echo "📝 Updating files..."
	@cp -f /tmp/gsum-update/gsum/bin/smart-gsum ~/bin/smart-gsum
	@cp -f /tmp/gsum-update/gsum/bin/gsummarize-wrapper ~/bin/gsummarize-wrapper
	@cp -f /tmp/gsum-update/gsum/claude-commands/gsum.md ~/.claude/commands/gsum.md
	@cp -rf /tmp/gsum-update/gsum/mcp-server ~/bin/gsum-mcp-server
	
	# Make executable
	@chmod +x ~/bin/smart-gsum
	@chmod +x ~/bin/gsummarize-wrapper
	@chmod +x ~/bin/gsum-mcp-server/index.js
	
	# Install MCP server dependencies
	@cd ~/bin/gsum-mcp-server && npm install --silent
	
	# Clean up
	@rm -rf /tmp/gsum-update
	
	@echo ""
	@echo "✅ gsum updated successfully!"
	@echo ""
	@echo "Changelog: https://github.com/jhurray/gsum/commits/main"

# Run tests
test:
	@echo "🧪 Running gsum tests..."
	@./test.sh