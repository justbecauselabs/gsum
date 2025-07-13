# gsum CLI Design

## Architecture Overview

### Single Node.js CLI Application
- Main entry: `cli/gsum.js` 
- Uses commander.js for command parsing
- All functionality in one place, no external dependencies on MCP

### Commands Structure

```
gsum [options]                    # Default: ephemeral summary to stdout
gsum save [options]              # Save persistent ARCHITECTURE.gsum.md
gsum plan <task> [options]       # Generate implementation plan
gsum update                      # Pull latest and rebuild
gsum version                     # Show version info
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

#### gsum save
- Same as default plus:
- `--file <path>` : Custom output file (default: ARCHITECTURE.gsum.md)
- `--force` : Force regeneration even if no changes

#### gsum plan
- `--context <file>` : Additional context file
- `--format <format>` : Output format

### Module Structure

```
cli/
├── gsum.js              # Main CLI entry point
├── lib/
│   ├── analyzer.js      # Core analysis logic (from MCP server)
│   ├── git.js          # Git integration (from smart-gsum)
│   ├── generator.js    # Summary generation
│   ├── gemini.js       # Gemini API integration
│   ├── fallback.js     # Claude fallback logic
│   └── utils.js        # Shared utilities
├── templates/
│   ├── summary.md      # Summary template
│   └── plan.md         # Plan template
└── package.json        # Dependencies
```

### Installation Strategy

1. **Primary Install**: `make install`
   - Builds CLI and installs to ~/bin/gsum
   - Single executable, no scattered scripts

2. **Optional Commands**: `make install-commands`
   - Creates /commands shortcuts for convenience
   - Not required for CLI to function

### Key Improvements

1. **Centralized**: All logic in one Node.js application
2. **No MCP**: Direct integration, no separate server
3. **Proper CLI**: Standard command/subcommand structure
4. **Extensible**: Easy to add new commands
5. **Debuggable**: Built-in verbose and debug modes
6. **Self-updating**: `gsum update` command