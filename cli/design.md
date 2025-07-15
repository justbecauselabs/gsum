# gsum CLI Design

## Architecture Overview

### Single Node.js CLI Application
- Main entry: `cli/gsum.js` 
- Uses commander.js for command parsing
- All functionality in one place, no external dependencies on MCP

### Commands Structure

```
gsum [options]                    # Default: ephemeral summary to stdout
gsum save [options]              # Save persistent ARCHITECTURE.gsum.md + .gsum/context.md
gsum plan <task> [options]       # Generate implementation plan
gsum update                      # Pull latest and rebuild
gsum version                     # Show version info
gsum interactive                 # Interactive guided mode
gsum fingerprint                 # Ultra-compressed project overview
```

### Global Options
- `--verbose, -v` : Enable verbose output
- `--debug, -d` : Enable debug mode with detailed logs
- `--help, -h` : Show help
- `--version` : Show version

### Command-Specific Options

#### gsum (default)
- `--format <format>` : Output format (markdown, json)
- `--depth <n>` : Directory traversal depth
- `--include <patterns>` : Include file patterns
- `--exclude <patterns>` : Exclude file patterns
- `--context-level <level>` : Context depth (minimal, standard, comprehensive)
- `--focus <area>` : Focus area (frontend, api, database, testing, deployment, tooling, documentation)
- `--smart-files <n>` : Include N most relevant files
- `--claude-optimized` : Generate Claude-optimized context (auto-enabled in Claude Code)

#### gsum save
- Same as default plus:
- `--file <path>` : Custom output file (default: ARCHITECTURE.gsum.md)
- `--force` : Force regeneration even if no changes
- `--claude-optimized` : Also generate .gsum/context.md cache

#### gsum plan
- `--context <file>` : Additional context file
- `--format <format>` : Output format
- `--smart-files <n>` : Include N task-relevant files
- `--fresh` : Force fresh analysis (ignore cache)
- `--claude-optimized` : Generate Claude-optimized task plan

### Module Structure

```
cli/
├── gsum.js              # Main CLI entry point
├── lib/
│   ├── analyzer.js      # Core analysis logic with import graph analysis
│   ├── cache-manager.js # Smart caching system for incremental updates
│   ├── claude-optimizer.js # Token optimization for Claude Code
│   ├── git.js          # Git integration for change detection
│   ├── generator.js    # Summary generation with Claude optimization
│   ├── gemini.js       # Gemini API integration
│   ├── claude.js       # Claude CLI integration
│   ├── fallback.js     # Claude fallback logic
│   ├── smart-files.js  # Smart file selection based on relevance
│   └── commands/       # Command implementations
│       ├── summary.js
│       ├── save.js
│       ├── plan.js
│       ├── interactive.js
│       ├── fingerprint.js
│       ├── llm-usage.js
│       └── update.js
└── package.json        # Dependencies
```

### Installation Strategy

1. **Primary Install**: `make install`
   - Builds CLI and installs to ~/bin/gsum
   - Single executable, no scattered scripts

2. **Optional Commands**: `make install-commands`
   - Creates /commands shortcuts for convenience
   - Not required for CLI to function

### Key Features

1. **Claude Optimization**: Token-efficient context generation for Claude Code
2. **Smart Caching**: Incremental updates based on git change analysis
3. **Import Graph Analysis**: File centrality scoring for better context selection
4. **Context Levels**: Minimal (3k), standard (5-7k), comprehensive (10k+ tokens)
5. **Focus Areas**: Target specific parts of codebase (frontend, api, etc.)
6. **Task-Aware Planning**: Context-aware implementation plans
7. **Interactive Mode**: Guided configuration
8. **Smart File Selection**: AI-powered relevance scoring
9. **Self-updating**: `gsum update` command
10. **Comprehensive Testing**: 62 tests covering all features