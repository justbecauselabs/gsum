# gsum - AI-Powered Codebase Summarization CLI

gsum is a powerful command-line tool that generates intelligent, context-aware summaries of codebases using AI. It helps developers quickly understand project structure, architecture, and implementation details.

## Features

- 🚀 **Ephemeral Summaries**: Generate fresh summaries on-demand for maximum context
- 💾 **Persistent Summaries**: Save summaries with intelligent git-aware regeneration
- 📋 **Implementation Planning**: Create detailed plans for new features based on codebase analysis
- 🔄 **Self-Updating**: Built-in update mechanism to stay current
- 🧠 **Smart Analysis**: Detects tech stack, architecture patterns, and project structure
- 🔍 **Git-Aware**: Only regenerates when significant changes occur (>500 lines)
- 🎯 **AI-Powered**: Uses Gemini API with Claude fallback for robust summarization

## Installation

### Requirements

- Node.js v16 or higher
- npm
- Git
- Gemini CLI (recommended)

### Quick Install

```bash
git clone https://github.com/jhurray/gsum.git
cd gsum
make install
```

### Optional: Install Claude Commands

If you use Claude Desktop, you can install slash commands:

```bash
make install-commands
```

This enables:
- `/gsum` - Generate ephemeral summary
- `/gsum-save` - Create/update persistent summary
- `/gsum-plan` - Generate implementation plans

## Usage

### Basic Commands

```bash
# Generate ephemeral summary of current directory
gsum

# Save persistent summary (ARCHITECTURE.gsum.md)
gsum save

# Generate implementation plan
gsum plan "add user authentication"

# Update gsum to latest version
gsum update

# Show help
gsum --help
```

### Options

```bash
# Enable verbose output
gsum -v

# Enable debug mode
gsum -d

# Specify output format
gsum --format json

# Force regeneration (ignore git checks)
gsum save --force

# Custom output file
gsum save --file MY_SUMMARY.md
```

### Advanced Usage

```bash
# Limit directory traversal depth
gsum --depth 5

# Include specific file patterns
gsum --include "*.js,*.ts"

# Exclude patterns
gsum --exclude "test/**,*.spec.js"

# Disable git integration
gsum --no-git
```

## How It Works

1. **Analysis**: gsum analyzes your codebase structure, file types, imports/exports
2. **Tech Stack Detection**: Automatically identifies frameworks, libraries, and tools
3. **AI Generation**: Uses Gemini API to create comprehensive documentation
4. **Git Integration**: Tracks changes to avoid unnecessary regeneration
5. **Smart Caching**: Caches analysis results for improved performance

## Architecture

gsum is built as a modular Node.js CLI application:

```
cli/
├── gsum.js              # Main CLI entry point
├── lib/
│   ├── analyzer.js      # Codebase analysis engine
│   ├── generator.js     # Summary generation orchestrator
│   ├── git.js          # Git integration and change tracking
│   ├── gemini.js       # Gemini API client
│   ├── fallback.js     # Claude fallback prompt generator
│   └── commands/       # Command implementations
└── package.json
```

## Configuration

### Gemini API

gsum requires Gemini CLI to be installed and configured. If you don't have it:

1. Install Gemini CLI
2. Configure API credentials
3. gsum will automatically use it

### Environment Variables

- `GEMINI_API_KEY` - Your Gemini API key (if not using Gemini CLI)
- `GSUM_DEBUG` - Enable debug logging

## Development

### Running Tests

```bash
make test
```

### Building Locally

```bash
cd cli
npm install
node gsum.js --version
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## Troubleshooting

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues and solutions.

## License

MIT License - see LICENSE file for details.

## Credits

Created by [jhurray](https://github.com/jhurray)

## Changelog

### v2.0.0
- Complete refactor into standalone CLI tool
- Removed MCP server dependency
- Added modular command structure
- Improved error handling and user experience

### v1.x
- Initial release with MCP server
- Basic summarization capabilities