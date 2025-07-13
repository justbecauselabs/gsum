# Changelog

All notable changes to gsum-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-13

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
- **npm Distribution**: Available via `npx gsum-cli` and `npm install -g gsum-cli`

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
npm install -g gsum-cli

# One-time usage
npx gsum-cli

# Development installation
git clone https://github.com/jhurray/gsum.git
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