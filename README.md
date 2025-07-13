# gsum - AI-Powered Codebase Summarization CLI

gsum is a powerful command-line tool that generates intelligent, context-aware summaries of codebases using AI. It helps developers quickly understand project structure, architecture, and implementation details.

## Why gsum?

Modern codebases are complex. Whether you're:
- 🆕 Onboarding to a new project
- 🤖 Providing context to AI assistants
- 📚 Documenting your architecture
- 🔍 Planning new features
- 🔄 Reviewing code changes

gsum analyzes your entire codebase and generates comprehensive, AI-powered documentation in seconds.

## Features

- 🚀 **Ephemeral Summaries**: Generate fresh summaries on-demand for maximum context
- 💾 **Persistent Summaries**: Save summaries with intelligent git-aware regeneration
- 📋 **Implementation Planning**: Create detailed, actionable plans for new features
- 🔄 **Self-Updating**: Built-in update mechanism to stay current
- 🧠 **Smart Analysis**: Detects tech stack, architecture patterns, and project structure
- 🔍 **Git-Aware**: Only regenerates when significant changes occur (>500 lines)
- 🎯 **AI-Powered**: Uses Gemini API with Claude fallback options
- 🛡️ **Standalone**: No external dependencies or MCP servers required
- 📊 **Context Levels**: Choose minimal (2-3k), standard (5-7k), or comprehensive (10k+) summaries
- 🔍 **Focus Areas**: Target specific areas like frontend, API, database, testing, deployment, tooling, or documentation
- 📂 **Path-Specific**: Analyze specific directories instead of entire codebase
- 🎮 **Interactive Mode**: Guided configuration for optimal results
- 🧠 **Smart File Inclusion**: Automatically include the most relevant files based on git history and imports
- 🗺️ **Codebase Fingerprint**: Ultra-compressed project overview in seconds

## Installation

### Requirements

- Node.js v16 or higher
- npm
- Git
- Gemini CLI (recommended) - for AI generation

### Quick Install

```bash
git clone https://github.com/jhurray/gsum.git
cd gsum
make install
```

The installer will:
- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Create the gsum executable
- ✅ Verify installation with `which gsum`
- ✅ Display the installed version

### Optional: Install Claude Commands

If you use Claude Desktop, install slash commands for seamless integration:

```bash
make install-commands
```

This enables:
- `/gsum` - Generate ephemeral summary
- `/gsum-save` - Create/update persistent summary
- `/gsum-plan <task>` - Generate implementation plans

**Note**: Commands are always overwritten on install/update to ensure you have the latest version.

## How It Works

### 1. Analysis Phase (Local)
gsum analyzes your codebase locally:
- 📁 Traverses directory structure (respects .gitignore patterns)
- 🔍 Detects programming languages and frameworks
- 📊 Counts files and analyzes imports/exports
- 🏗️ Identifies architecture patterns
- 📦 Extracts package.json, go.mod, requirements.txt, etc.
- 🌿 Captures git information (branch, last commit)

### 2. Generation Phase (AI-Powered)
gsum creates a detailed prompt and sends it to Gemini:
- 📝 Builds prompt tailored to your chosen context level
- 🤖 Gemini analyzes and generates documentation
- 📄 Returns documentation sized for your needs (2-3k to 10k+ words)

### 3. Output Phase
Depending on the command:
- **Default**: Prints to terminal (ephemeral)
- **Save**: Writes to file with git metadata
- **Plan**: Outputs actionable implementation steps

## Usage

### Basic Commands

```bash
# Generate ephemeral summary of current directory
gsum

# Save persistent summary (ARCHITECTURE.gsum.md)
gsum save

# Generate implementation plan
gsum plan "add user authentication"

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

### Interactive Mode 🎮

Not sure which options to use? Let gsum guide you:

```bash
gsum interactive
# or
gsum i
```

The interactive mode will walk you through:
- Choosing between ephemeral or persistent summaries
- Selecting the right context level
- Picking a focus area if needed
- Configuring advanced options
- Reviewing your choices before execution

Perfect for first-time users or complex configurations!

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

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for detailed solutions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `make test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Credits

Created by [jhurray](https://github.com/jhurray)

## Changelog

### v1.0.0 (Prerelease)
- Initial release as standalone CLI tool
- AI-powered codebase analysis and documentation
- Git-aware intelligent regeneration
- Support for ephemeral and persistent summaries
- Implementation planning features
- Gemini API integration with Claude fallback
- Self-updating capabilities
- Claude Desktop slash commands