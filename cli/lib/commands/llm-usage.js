function generateLLMUsageGuide() {
  return `# gsum Usage Guide for LLMs

## Overview
gsum is a CLI tool that analyzes codebases and generates comprehensive documentation using AI.

## Basic Commands

### Generate ephemeral summary (default)
\`\`\`bash
gsum
\`\`\`

### Save persistent summary with git tracking
\`\`\`bash
gsum save
\`\`\`

### Generate implementation plan
\`\`\`bash
gsum plan "add user authentication"
\`\`\`

## Options

### Global Options
- \`-v, --verbose\` : Show detailed progress
- \`-d, --debug\` : Show debug information
- \`--help\` : Show help

### Summary Options
- \`--format <format>\` : Output format (markdown, json)
- \`--depth <n>\` : Directory traversal depth
- \`--include <patterns>\` : Include file patterns
- \`--exclude <patterns>\` : Exclude file patterns
- \`--no-git\` : Disable git integration

### Save Options
- \`--force\` : Force regeneration even if no changes
- \`--file <path>\` : Custom output file

## How gsum Works

1. **Analysis Phase**: Scans directory structure, detects tech stack, counts files
2. **Generation Phase**: Creates prompt with project info, calls AI to generate docs
3. **Output Phase**: Prints to terminal or saves to file with git tracking

## Git Integration

- Tracks changes using git hash
- Only regenerates when >500 lines changed
- Stores hash and branch info in generated files

## Examples

\`\`\`bash
# Basic usage
gsum

# Save with custom file
gsum save --file MY_DOCS.md

# Force regeneration
gsum save --force

# Verbose mode
gsum -v

# Exclude test files
gsum --exclude "test/**,*.spec.js"

# Plan a feature
gsum plan "implement REST API for user management"
\`\`\`

## Integration with AI Tools

- **Gemini**: Can use gsum directly via CLI
- **Claude**: Use slash commands (/gsum, /gsum-save, /gsum-plan)
- **Other LLMs**: Can execute gsum commands via bash

## Best Practices

1. Run \`gsum\` first to understand the codebase
2. Use \`gsum save\` for persistent documentation
3. Use \`gsum plan\` before implementing features
4. Add \`--verbose\` when debugging issues`;
}

async function runLLMUsage() {
  const guide = generateLLMUsageGuide();
  console.log(guide);
}

module.exports = { runLLMUsage };