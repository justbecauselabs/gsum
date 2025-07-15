# gsum - Codebase Context Optimizer for Agentic AI CLIs

gsum is a specialized command-line tool designed to optimize codebase context for agentic AI CLIs like **Gemini CLI** and **Claude CLI**. It dramatically reduces token usage, saves context windows, and minimizes tool calls by generating intelligent, compressed summaries of your codebase.

## Why gsum?

**Agentic AI CLIs like Gemini CLI and Claude CLI are powerful, but they burn through tokens and context windows fast.** gsum solves this by:

- 🚀 **Reducing token usage by 80%** - Generate compressed, relevant context instead of sending entire codebases
- ⚡ **Minimizing tool calls** - One gsum command replaces dozens of file reads and searches  
- 🎯 **Saving context windows** - Smart summarization keeps you under token limits
- 🔄 **Caching results** - Instant reuse of analysis to avoid repeated work
- 📊 **Optimizing for AI consumption** - Output specifically designed for Claude Code, Gemini CLI, and other agentic tools

**💡 Primary Use Case**: Run gsum within **Claude Code** to leverage **Gemini CLI's large context window and free API tier**. Instead of Claude Code burning through your limited Claude tokens reading 50+ files, gsum defers the heavy analysis work to Gemini's generous free tier, then provides Claude with the essential context in a single, optimized summary.

## Quick Start

```bash
# 🔥 NEW USER? Start here! Zero learning curve:
gsum interactive

# Try gsum without installing
npx gsum

# Install globally
npm install -g gsum

# Generate summary of current directory
gsum

# Focus on frontend files
gsum --focus frontend
```

## Features

**🎯 Agentic AI CLI Optimization:**
- ⚡ **Claude Code Auto-Detection**: Automatically optimizes output when running in Claude Code environment
- 🚀 **80% Token Reduction**: Generate 3k-token contexts vs 5-7k standard summaries  
- 📦 **Smart Caching**: Instant reuse (< 1 second) with incremental updates only when needed
- 🎯 **Import Graph Analysis**: File centrality scoring to surface the most critical code
- 🔄 **Gemini CLI Integration**: Seamless integration with Google's Gemini CLI for AI generation

**📊 Context Management:**
- 📊 **Context Levels**: Choose minimal (2-3k), standard (5-7k), or comprehensive (10k+) summaries
- 🔍 **Focus Areas**: Target specific areas like frontend, API, database, testing, deployment, tooling, or documentation
- 📂 **Path-Specific**: Analyze specific directories instead of entire codebase
- 🧠 **Smart File Inclusion**: Automatically include the most relevant files based on git history and imports

**🛠️ Core Features:**
- 🚀 **Ephemeral Summaries**: Generate fresh summaries on-demand for maximum context
- 💾 **Persistent Summaries**: Save summaries with intelligent git-aware regeneration
- 📋 **Implementation Planning**: Create detailed, actionable plans for new features
- 🎮 **Interactive Mode**: Zero-learning-curve guided configuration with intelligent project analysis
- 🗺️ **Codebase Fingerprint**: Ultra-compressed project overview in seconds
- 🔍 **Git-Aware**: Only regenerates when significant changes occur (>500 lines)
- 🛡️ **Standalone**: No external dependencies or MCP servers required

## Installation

### Requirements

- Node.js v16 or higher
- npm
- Git (for git-based installation)
- Gemini CLI (recommended) - for AI generation

### Quick Install (npm)

```bash
# Global installation
npm install -g gsum

# Or use without installing
npx gsum
```

### Development Install (git)

```bash
git clone https://github.com/jhurray/gsum.git
cd gsum
make install
```

The git installer will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Create the gsum executable
- ✅ Verify installation with `which gsum`
- ✅ Display the installed version

### Optional: Install Claude Commands

If you use Claude Desktop and installed via git, add slash commands for seamless integration:

```bash
make install-commands
```

This enables:
- `/gsum` - Generate ephemeral summary
- `/gsum-save` - Create/update persistent summary
- `/gsum-plan <task>` - Generate implementation plans
- `/gsum-interactive` - 🔥 **Interactive guided mode** (works in any repo!)

**Note**: Claude commands are only available with git installation. Commands are always overwritten on install/update to ensure you have the latest version.

## How It Works

### LLM Provider Selection

gsum is designed to **maximize efficiency for agentic AI CLIs** by automatically adapting its behavior:

**🎯 Primary Mode - Claude Code + Gemini CLI:**
- **Auto-detects Claude Code** via `CLAUDE_CODE` or `CLAUDE_DESKTOP_TOOLS_ACTIVE` environment variables
- **Defers heavy work to Gemini CLI** (`gemini --yolo` command) to leverage its large context window and free API tier
- **Optimizes output for Claude consumption**: 3k tokens vs 5-7k standard, structured for AI understanding
- **Smart caching**: Results cached for instant reuse, incremental updates only when needed
- **Perfect for development workflows**: Claude handles conversations, Gemini handles codebase analysis

**🔧 Standalone Gemini Mode:**
- Uses **Gemini CLI** as the default LLM provider when not in Claude Code
- Generates comprehensive markdown documentation via Gemini API
- Full project analysis with all documentation sections
- Standard token limits (no aggressive optimization)

**🛡️ Fallback Options:**
- `--fallback`: Generates prompt you can copy to Claude manually (when Gemini quota exceeded)
- `--claude-execute`: Attempts to use local Claude CLI if installed
- `--claude-only`: Bypasses LLM entirely, generates analysis data only

**💡 Key Insight**: The tool is specifically architected so Claude Code users can offload expensive codebase analysis to Gemini's free tier while keeping their Claude tokens for actual development work.

### 1. Analysis Phase (Local)
gsum analyzes your codebase locally:
- 📁 Traverses directory structure (respects .gitignore patterns)
- 🔍 Detects programming languages and frameworks
- 📊 Counts files and analyzes imports/exports
- 🏗️ Identifies architecture patterns
- 📦 Extracts package.json, go.mod, requirements.txt, etc.
- 🌿 Captures git information (branch, last commit)

### 2. Generation Phase (AI-Powered)
**Gemini Mode (Default):**
- 📝 Builds comprehensive prompt for Gemini CLI
- 🤖 Gemini analyzes and generates full documentation
- 📄 Returns documentation sized for your needs (2-3k to 10k+ words)

**Claude Code Mode (Auto-Enabled):**
- 📝 Builds token-optimized context with smart file selection
- 🤖 Returns structured, minimal context for Claude consumption
- 💾 Caches context for instant reuse on subsequent runs

### 3. Output Phase
Depending on the command and environment:
- **Default**: Prints to terminal (ephemeral)
- **Save**: Writes to file with git metadata
- **Plan**: Outputs actionable implementation steps
- **Claude Code**: Returns optimized context for AI assistant consumption

## Usage

### Basic Commands

```bash
# Generate ephemeral summary of current directory
gsum

# Save persistent summary (ARCHITECTURE.gsum.md)
gsum save

# Generate implementation plan
gsum plan "add user authentication"

# Plan with task-relevant files
gsum plan "fix auth bug" --smart-files 10

# Force fresh analysis (ignore cache)
gsum plan "refactor API" --fresh

# Claude-optimized plan
gsum plan "add OAuth" --claude-optimized

# Update gsum to latest version (from anywhere)
gsum update

# Show usage guide for LLMs
gsum llm-usage

# Show detailed help
gsum --help

# Interactive mode - guided configuration
gsum interactive
# or short alias
gsum i

# Ultra-compressed project overview
gsum fingerprint
# or short alias
gsum fp

# Fingerprint as JSON
gsum fingerprint --format json
```

### Key Options

```bash
# Verbose output (see what gsum is doing)
gsum -v

# Debug mode (detailed logs)
gsum -d

# Force regeneration (ignore git checks)
gsum save --force

# Custom output file
gsum save --file MY_DOCS.md

# Generate fallback prompt on quota error
gsum --fallback

# Try Claude CLI on quota error (experimental)
gsum --claude-execute
```

### Progress & Timeout Features 🏃‍♂️

gsum now provides better visibility and control when running AI operations:

```bash
# Auto-verbose mode in Claude Code
# When running through Claude Code, gsum automatically enables verbose mode

# Set custom timeout (default: 5 minutes)
export GSUM_TIMEOUT=600000  # 10 minutes in milliseconds
gsum save

# Verbose mode shows:
# - 🚀 Execution start with working directory
# - 📝 Prompt length information
# - ⏳ Real-time progress with elapsed time
# - ✅ Completion status
# - ⏱️ Timeout warnings if exceeded
```

**Progress indicators** show animated dots with elapsed time:
```
⏳ Gemini is processing.... (45s)
```

**Benefits:**
- No more hanging processes
- Clear visibility of what's happening
- Configurable timeouts for long operations
- Automatic verbose mode in AI assistants

### Context Levels 🎯

Control the depth and detail of generated summaries:

```bash
# Minimal context (2-3k words) - Essential architecture only
gsum --context-level minimal

# Standard context (5-7k words) - Balanced detail [DEFAULT for gsum]
gsum --context-level standard

# Comprehensive context (10k+ words) - Full documentation [DEFAULT for save]
gsum --context-level comprehensive
```

**When to use each level:**
- **minimal**: Quick context for AI assistants with limited windows
- **standard**: Day-to-day development tasks and code reviews
- **comprehensive**: Full architectural documentation, onboarding

### Focus Areas 🔍

Generate targeted summaries for specific parts of your codebase:

```bash
# Focus on frontend components and UI
gsum --focus frontend

# Focus on backend API and endpoints
gsum --focus api

# Focus on database models and schemas
gsum --focus database

# Focus on test structure and coverage
gsum --focus testing

# Focus on deployment and CI/CD
gsum --focus deployment

# Focus on build tools and configuration
gsum --focus tooling

# Focus on documentation and guides
gsum --focus documentation
```

**How it works:**
- Filters files based on directories, extensions, and keywords
- Adjusts document sections to match the focus area
- Reduces noise by excluding unrelated code

**Example combinations:**
```bash
# Quick frontend overview
gsum --focus frontend --context-level minimal

# Comprehensive API documentation
gsum save --focus api --context-level comprehensive
```

### Path-Specific Summaries 📂

Generate summaries for specific directories:

```bash
# Summarize a specific directory
gsum src/api

# Summarize a subdirectory
gsum src/components/Auth

# Save summary for a specific path
gsum save backend/

# Combine with other options
gsum src/frontend --focus frontend --context-level minimal
```

**Benefits:**
- Analyze only the parts you're working on
- Faster generation for large codebases
- More focused and relevant summaries

### Claude Optimization ⚡

gsum now includes special optimizations for Claude Code users:

```bash
# Auto-enabled in Claude Code environment
gsum  # Automatically uses Claude optimization

# Force Claude optimization
gsum --claude-optimized

# Save with Claude context cache
gsum save --claude-optimized

# Generate optimized implementation plan
gsum plan "add auth" --claude-optimized
```

**Features:**
- **Auto-detection**: Automatically optimizes output when running in Claude Code
- **Token efficiency**: Generates 3,000-token contexts (vs 5,000-7,000 standard)
- **Smart caching**: Caches context in `.gsum/` for instant reuse
- **Incremental updates**: Only regenerates when significant changes occur
- **Import graph analysis**: Scores files by centrality for better context

**Cache structure:**
```
.gsum/
├── context.md           # Claude-optimized context
├── cache-metadata.json  # Cache tracking info
└── file-summaries/      # Individual file analysis
```

**Benefits for Claude Code:**
- ⚡ Instant context (< 1 second with cache)
- 📉 80% reduction in discovery overhead
- 🎯 More actionable, less verbose output
- 🔄 Smart incremental updates

### Interactive Mode 🎮

**The most user-friendly way to use gsum!** Not sure which options to use? Let gsum guide you step-by-step:

```bash
gsum interactive
# or
gsum i
```

**🔥 What makes Interactive Mode special:**

- **🧠 Smart Analysis First** - Analyzes your project structure and suggests optimal settings
- **🎯 Guided Questions** - Asks you exactly 3 simple questions, one at a time
- **✨ Intelligent Defaults** - Recommends the best options based on your tech stack
- **🔧 Perfect Command Generation** - Builds the exact gsum command for your needs
- **✅ Safety First** - Shows you the command before executing it
- **⚡ Zero Learning Curve** - No need to memorize CLI flags or options

**The interactive experience:**
1. **📊 Project Fingerprint** - Instantly scans your repo structure and tech stack
2. **❓ Question 1** - Ephemeral (chat) or persistent (file) summary?
3. **❓ Question 2** - How detailed? (minimal/standard/comprehensive)
4. **❓ Question 3** - Focus area? (frontend/API/database/all areas/etc.)
5. **🛠️ Command Preview** - Shows the exact command it will run
6. **🚀 One-Click Execute** - Runs your perfectly configured gsum command

**Perfect for:**
- 🆕 **First-time users** - Learn gsum without reading docs
- 🤔 **Complex projects** - Get intelligent recommendations 
- ⚡ **Quick setup** - Faster than figuring out CLI flags
- 🎯 **Optimal results** - Ensures you get the best possible summary

Interactive mode eliminates the guesswork and ensures you always get the perfect gsum configuration for your project!

### Smart File Inclusion 🧠

Automatically include the most relevant files in your summary:

```bash
# Include 10 most relevant files
gsum --smart-files 10

# Include 5 most relevant files for a specific task
gsum plan "add authentication" --smart-files 5

# Combine with other options
gsum --focus api --smart-files 15
```

**How it works:**
- Analyzes git history for recently changed files
- Identifies highly imported/central files
- Considers file type importance and complexity
- Automatically includes file contents in the summary

**Perfect for:**
- Getting AI to focus on the exact files that matter
- Task-specific planning with relevant code context
- Understanding core architecture through key files

### Codebase Fingerprint 🗺️

Get an ultra-compressed overview of any project:

```bash
# Generate fingerprint
gsum fingerprint

# Fingerprint for specific directory
gsum fingerprint src/

# Output as JSON
gsum fingerprint --format json
```

**Example output:**
```
🗺️  Codebase Fingerprint

📦 my-app
🔧 Tech: React/TypeScript/Node.js
🏗️  Structure: Monorepo with 3 packages
📄 Files: 127 (.ts: 89, .tsx: 38, .json: 15)
🎯 Patterns: Redux state, REST API, Unit tests
📚 Dependencies: 47 prod, 23 dev
🌿 Git: main branch, 1,234 commits, 5 contributors
```

**Perfect for:**
- Quick project assessment
- Sharing project overview in discussions
- Understanding new codebases at a glance

### Advanced Options

```bash
# Limit directory depth
gsum --depth 5

# Include only specific files
gsum --include "*.js,*.ts"

# Exclude patterns
gsum --exclude "test/**,*.spec.js"

# Disable git integration
gsum --no-git

# Output as JSON
gsum --format json
```

## Git-Aware Intelligence

gsum save is smart about regeneration:

1. **First Run**: Generates and saves with git metadata
2. **Subsequent Runs**: 
   - Checks current git hash vs stored hash
   - Counts lines changed with `git diff`
   - Only regenerates if >500 lines changed
   - Use `--force` to override

Saved files include:
```markdown
[Your documentation content]

<!-- git-hash: abc123def456 -->
<!-- git-branch: main -->
```

## Handling Quota Limits

When Gemini quota is exceeded, gsum provides options:

1. **Generate Fallback Prompt** (`--fallback`)
   ```bash
   gsum --fallback
   ```
   Creates a detailed prompt you can copy to Claude

2. **Try Claude CLI** (`--claude-execute`)
   ```bash
   gsum --claude-execute
   ```
   Experimental: Attempts to run with Claude CLI directly

3. **Wait for Reset**
   Gemini quotas typically reset daily

## Architecture

gsum is a modular Node.js CLI application:

```
gsum/
├── cli/
│   ├── gsum.js              # Main CLI entry point
│   ├── lib/
│   │   ├── analyzer.js      # Codebase analysis engine
│   │   ├── generator.js     # Summary generation orchestrator
│   │   ├── git.js          # Git integration and change tracking
│   │   ├── gemini.js       # Gemini API client
│   │   ├── claude.js       # Claude CLI client (experimental)
│   │   ├── fallback.js     # Fallback prompt generator
│   │   └── commands/       # Command implementations
│   └── package.json        # Dependencies
├── install.sh              # Smart installer script
├── test.sh                # Test suite
└── Makefile               # Build automation
```

### Key Design Decisions

- **Standalone CLI**: No MCP server dependencies
- **Local Analysis**: All file analysis happens locally
- **AI Generation**: Leverages Gemini's capabilities
- **Git Integration**: Smart caching and regeneration
- **Extensible**: Easy to add new commands

## Examples

### For a React Project
```bash
$ gsum
# Outputs comprehensive guide including:
# - Component architecture
# - State management approach
# - Routing structure
# - Build configuration
# - Testing setup
```

### For a Go Microservice
```bash
$ gsum save
# Creates ARCHITECTURE.gsum.md with:
# - Service architecture
# - API endpoints
# - Database models
# - Dependency injection
# - Deployment configuration
```

### Planning a Feature
```bash
$ gsum plan "add real-time notifications"
# Generates step-by-step plan:
# 1. WebSocket server setup
# 2. Frontend integration points
# 3. Database schema changes
# 4. API modifications
# 5. Testing approach
```

## Integration with AI Tools

### Claude Desktop
After running `make install-commands`:
- Type `/gsum` in any conversation
- Claude runs gsum on your current directory
- Full analysis appears in chat

### Other LLMs
Use `gsum llm-usage` to see integration guide:
```bash
$ gsum llm-usage
# Shows examples and best practices for LLMs
```

## Troubleshooting

### Common Issues

**gsum: command not found**
- Run `source ~/.bashrc` (or `~/.zshrc`)
- Check `echo $PATH` includes `~/bin`

**Gemini quota exceeded**
- Use `gsum --fallback` for Claude prompt
- Or wait for daily reset

**Summary not updating**
- Check git status: `git status`
- Use `gsum save --force` to force update

**Command times out**
- Default timeout is 5 minutes
- Increase timeout: `export GSUM_TIMEOUT=600000` (10 minutes)
- Enable verbose mode to see progress: `gsum -v`
- Large codebases may need longer timeouts

**No progress visible in Claude Code**
- gsum auto-detects Claude Code and enables verbose mode
- If not working, manually use: `gsum -v`
- Check for environment variable: `echo $CLAUDE_CODE`

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed solutions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally:
   ```bash
   make test           # Run test suite
   npm pack           # Test npm package
   ```
5. Submit a pull request

### Distribution
- **npm users**: `npm install -g gsum` or `npx gsum`
- **Developers**: `git clone` + `make install` for full development setup

## License

MIT License - see LICENSE file for details.

## Credits

Created by [jhurray](https://github.com/jhurray)

## Changelog

### v0.1.1 (Latest)
- **Progress Indicators**: Real-time progress with elapsed time during AI operations
- **Configurable Timeouts**: Default 5-minute timeout, customizable via `GSUM_TIMEOUT` env var
- **Claude Code Integration**: Auto-detects Claude Code environment and enables verbose mode
- **Enhanced Logging**: Emoji-based status messages for better visibility
- **Real-time Output**: Shows AI output as it's generated in verbose mode
- **Better Error Handling**: Clear timeout messages and graceful process termination

### v0.1.0
- **npm Distribution**: Available via `npm install -g gsum` and `npx gsum`
- **Smart Context Levels**: Minimal, standard, and comprehensive summaries
- **Focus Areas**: Target frontend, API, database, testing, deployment, tooling, documentation
- **Interactive Mode**: Guided configuration for optimal results
- **Smart File Inclusion**: AI-powered selection of most relevant files
- **Codebase Fingerprint**: Ultra-compressed project overview
- **Path-Specific Summaries**: Analyze specific directories
- **Dual Distribution**: Both npm and git installation methods
- **Comprehensive Testing**: 51 tests across Node.js 16/18/20
- **CI/CD Pipeline**: Automated testing and publishing
- **Full Documentation**: Complete guides and troubleshooting

### Core Features
- AI-powered codebase analysis and documentation
- Git-aware intelligent regeneration
- Support for ephemeral and persistent summaries
- Implementation planning features
- Gemini API integration with Claude fallback
- Self-updating capabilities
- Claude Desktop slash commands (git install only)