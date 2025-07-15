# Changelog

All notable changes to gsum-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-07-15

### Added
- **Claude Optimization**: Special mode for Claude Code users
  - Auto-detection of Claude Code environment
  - Token-efficient output (3k tokens vs 5-7k standard)
  - `--claude-optimized` flag for manual activation
- **Smart Caching System**: Incremental context updates
  - Cache stored in `.gsum/` directory
  - File-level analysis caching with SHA hashes
  - Micro/partial/full update strategies based on change impact
  - Context reuse for instant summaries (< 1 second)
- **Import Graph Analysis**: Better file selection
  - Tracks import/export relationships between files
  - Calculates file centrality scores (0-100)
  - Prioritizes highly-imported utility files
- **Enhanced Plan Command**: Task-aware planning
  - `--smart-files <n>` for task-relevant file inclusion
  - `--fresh` flag to force new analysis
  - `--claude-optimized` for token-efficient plans
  - Cached project analysis for faster generation
- **Enhanced Save Command**: Dual output mode
  - Generates both `ARCHITECTURE.gsum.md` and `.gsum/context.md`
  - Claude context cache creation with `--claude-optimized`

### Changed
- Analyzer now builds import dependency graphs
- Generator supports multiple optimization modes
- Smart file selection uses centrality scores
- Plan command uses dynamic output filenames

### Technical
- Added `cache-manager.js` for smart caching logic
- Added `claude-optimizer.js` for token optimization
- Enhanced analyzer with import graph capabilities
- Added comprehensive test suites for new features
- Total test count increased to 62

## [0.1.1] - 2025-07-14

### Added
- **Progress Indicators**: Real-time progress display with elapsed time during AI operations
  - Shows animated dots: `⏳ Gemini is processing.... (45s)`
  - Clear visibility of operation status
- **Configurable Timeouts**: Prevent hanging processes
  - Default 5-minute timeout
  - Customizable via `GSUM_TIMEOUT` environment variable (milliseconds)
  - Graceful termination with clear error messages
- **Claude Code Integration**: Enhanced AI assistant experience
  - Auto-detects Claude Code environment (`CLAUDE_CODE`, `CLAUDE_DESKTOP_TOOLS_ACTIVE`)
  - Automatically enables verbose mode for better visibility
- **Enhanced Logging**: Improved status messages with emojis
  - 🚀 Starting execution
  - 📍 Working directory info
  - 🔍 Analysis progress
  - ✅ Completion status
  - ⏱️ Timeout warnings
- **Real-time Output**: Shows AI output as it's generated in verbose mode

### Changed
- Switched from `execSync` to `spawn` for better process control in gemini.js and claude.js
- Improved error handling with specific timeout errors
- Better verbose output throughout the generation pipeline

### Fixed
- Fixed timeout issues when running through Claude Code
- Fixed hanging processes during Gemini/Claude execution
- Improved process cleanup on errors or timeouts

## [0.1.0] - 2025-07-13

### Added
- **Smart Context Levels**: Choose between minimal, standard, and comprehensive context
  - `minimal`: 5 key sections (~500 words)
  - `standard`: 10 sections (~1500 words) 
  - `comprehensive`: All 18 sections (~3000 words)
- **Focus Areas**: Target specific aspects of your codebase
  - `frontend`: React, Vue, Angular, UI components
  - `api`: REST APIs, GraphQL, routes, middleware
  - `database`: Models, schemas, migrations, queries
  - `testing`: Test files, specs, mocks, fixtures
  - `deployment`: CI/CD, Docker, infrastructure
  - `tooling`: Build tools, linters, configs
  - `documentation`: README, docs, comments
- **Path-Specific Summaries**: Generate summaries for specific directories
- **Interactive Mode**: Guided configuration with smart defaults
- **Smart File Inclusion**: AI-powered selection of most relevant files
- **Codebase Fingerprint**: Ultra-compressed project overview
- **Comprehensive CLI**: Full-featured command interface
- **GitHub Actions CI**: Automated testing across Node.js versions
- **npm Distribution**: Available via `npx gsum` and `npm install -g gsum`

### Features
- AI-powered codebase analysis using Gemini and Claude
- Git-aware file tracking and change detection
- Flexible output formats (markdown, JSON)
- Advanced filtering with include/exclude patterns
- LLM usage tracking and optimization
- Cross-platform compatibility (macOS, Linux, Windows)

### Technical
- Node.js 16+ support
- Zero external AI API dependencies (uses local Gemini/Claude CLIs)
- Comprehensive test suite (51 tests)
- Security auditing and dependency scanning
- Semantic versioning and automated releases

### Installation
```bash
# Global installation
npm install -g gsum

# One-time usage
npx gsum

# Development installation
git clone https://github.com/justbecauselabs/gsum.git
cd gsum && make install
```

### Usage Examples
```bash
# Quick project overview
gsum fingerprint

# Focus on frontend files
gsum --focus frontend

# Interactive configuration
gsum interactive

# Comprehensive analysis
gsum --context-level comprehensive

# Save persistent summary
gsum save --force
```