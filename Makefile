.PHONY: install install-commands update test clean help

# Default target
help:
	@echo "gsum - AI-powered codebase summarization CLI"
	@echo ""
	@echo "Available commands:"
	@echo "  make install          - Install gsum CLI"
	@echo "  make install-commands - Install Claude /gsum commands (optional)"
	@echo "  make update          - Update to latest version"
	@echo "  make test            - Run test suite"
	@echo "  make clean           - Remove installed files"
	@echo "  make help            - Show this help message"

# Install the CLI
install:
	@echo "🚀 Installing gsum CLI..."
	@chmod +x install.sh
	@./install.sh

# Install Claude commands (optional)
install-commands:
	@echo "📝 Installing Claude commands..."
	@echo ""
	
	# Check if Claude is installed
	@if ! command -v claude &> /dev/null; then \
		echo "⚠️  Claude CLI not found"; \
		echo "   Please install Claude Desktop first:"; \
		echo "   https://claude.ai/download"; \
		exit 1; \
	fi
	
	# Create commands directory
	@mkdir -p ~/.claude/commands
	
	# Create wrapper script for Claude
	@echo "#!/bin/bash" > ~/bin/claude-gsum-wrapper
	@echo "# Wrapper for Claude to call gsum" >> ~/bin/claude-gsum-wrapper
	@echo "" >> ~/bin/claude-gsum-wrapper
	@echo "# Parse the mode from arguments" >> ~/bin/claude-gsum-wrapper
	@echo 'MODE="$$1"' >> ~/bin/claude-gsum-wrapper
	@echo 'shift' >> ~/bin/claude-gsum-wrapper
	@echo "" >> ~/bin/claude-gsum-wrapper
	@echo 'case "$$MODE" in' >> ~/bin/claude-gsum-wrapper
	@echo '  ephemeral)' >> ~/bin/claude-gsum-wrapper
	@echo '    gsum "$$@"' >> ~/bin/claude-gsum-wrapper
	@echo '    ;;' >> ~/bin/claude-gsum-wrapper
	@echo '  save)' >> ~/bin/claude-gsum-wrapper
	@echo '    gsum save "$$@"' >> ~/bin/claude-gsum-wrapper
	@echo '    ;;' >> ~/bin/claude-gsum-wrapper
	@echo '  plan)' >> ~/bin/claude-gsum-wrapper
	@echo '    # First argument after mode is the task' >> ~/bin/claude-gsum-wrapper
	@echo '    TASK="$$1"' >> ~/bin/claude-gsum-wrapper
	@echo '    shift' >> ~/bin/claude-gsum-wrapper
	@echo '    gsum plan "$$TASK" "$$@"' >> ~/bin/claude-gsum-wrapper
	@echo '    ;;' >> ~/bin/claude-gsum-wrapper
	@echo '  *)' >> ~/bin/claude-gsum-wrapper
	@echo '    echo "Unknown mode: $$MODE"' >> ~/bin/claude-gsum-wrapper
	@echo '    exit 1' >> ~/bin/claude-gsum-wrapper
	@echo '    ;;' >> ~/bin/claude-gsum-wrapper
	@echo 'esac' >> ~/bin/claude-gsum-wrapper
	@chmod +x ~/bin/claude-gsum-wrapper
	
	# Note: Always overwrite existing commands to ensure they're up-to-date
	# Create /gsum command
	@echo '---' > ~/.claude/commands/gsum.md
	@echo 'description: Generates a fresh, detailed summary of the current project for ephemeral context.' >> ~/.claude/commands/gsum.md
	@echo 'allowed-tools: [bash, Read, Grep, Glob, LS]' >> ~/.claude/commands/gsum.md
	@echo '---' >> ~/.claude/commands/gsum.md
	@echo '' >> ~/.claude/commands/gsum.md
	@echo 'Generating ephemeral project summary for current context...' >> ~/.claude/commands/gsum.md
	@echo '' >> ~/.claude/commands/gsum.md
	@echo '!claude-gsum-wrapper ephemeral $$ARGUMENTS' >> ~/.claude/commands/gsum.md
	
	# Create /gsum-save command
	@echo '---' > ~/.claude/commands/gsum-save.md
	@echo 'description: Creates or updates a persistent ARCHITECTURE.gsum.md file with intelligent git-aware regeneration.' >> ~/.claude/commands/gsum-save.md
	@echo 'allowed-tools: [bash, Read, Write, Grep, Glob, LS]' >> ~/.claude/commands/gsum-save.md
	@echo '---' >> ~/.claude/commands/gsum-save.md
	@echo '' >> ~/.claude/commands/gsum-save.md
	@echo 'Creating/updating persistent project summary (ARCHITECTURE.gsum.md)...' >> ~/.claude/commands/gsum-save.md
	@echo '' >> ~/.claude/commands/gsum-save.md
	@echo '!claude-gsum-wrapper save $$ARGUMENTS' >> ~/.claude/commands/gsum-save.md
	
	# Create /gsum-plan command
	@echo '---' > ~/.claude/commands/gsum-plan.md
	@echo 'description: Generates a detailed implementation plan for a specific task based on codebase analysis.' >> ~/.claude/commands/gsum-plan.md
	@echo 'allowed-tools: [bash, Read, Grep, Glob, LS]' >> ~/.claude/commands/gsum-plan.md
	@echo 'parameter: task The task to create an implementation plan for' >> ~/.claude/commands/gsum-plan.md
	@echo '---' >> ~/.claude/commands/gsum-plan.md
	@echo '' >> ~/.claude/commands/gsum-plan.md
	@echo 'Generating implementation plan for: $$ARGUMENTS' >> ~/.claude/commands/gsum-plan.md
	@echo '' >> ~/.claude/commands/gsum-plan.md
	@echo '!claude-gsum-wrapper plan $$ARGUMENTS' >> ~/.claude/commands/gsum-plan.md
	
	@echo ""
	@echo "✅ Claude commands installed successfully!"
	@echo ""
	@echo "Available commands in Claude:"
	@echo "  /gsum         - Generate ephemeral summary"
	@echo "  /gsum-save    - Create/update ARCHITECTURE.gsum.md"
	@echo "  /gsum-plan    - Generate implementation plan"

# Update to latest version
update:
	@echo "📦 Updating gsum..."
	@gsum update

# Run tests
test:
	@echo "🧪 Running gsum tests..."
	@./test.sh

# Clean installation
clean:
	@echo "🧹 Removing gsum installation..."
	@rm -f ~/bin/gsum
	@rm -f ~/bin/claude-gsum-wrapper
	@rm -f ~/.claude/commands/gsum.md
	@rm -f ~/.claude/commands/gsum-save.md
	@rm -f ~/.claude/commands/gsum-plan.md
	@rm -rf ~/bin/gsum-mcp-server
	@echo "✅ gsum has been removed"
	@echo "   Note: You may want to remove aliases from your shell RC file"