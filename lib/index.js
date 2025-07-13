/**
 * gsum CLI Library - npm package main export
 * 
 * This module exports the core functionality for programmatic use
 */

const path = require('path');

// Re-export functionality from the CLI implementation
const cliLib = path.join(__dirname, '../cli/lib');

module.exports = {
  // Core modules
  analyzer: require(path.join(cliLib, 'analyzer')),
  generator: require(path.join(cliLib, 'generator')),
  gemini: require(path.join(cliLib, 'gemini')),
  claude: require(path.join(cliLib, 'claude')),
  git: require(path.join(cliLib, 'git')),
  smartFiles: require(path.join(cliLib, 'smart-files')),
  
  // Commands
  commands: {
    summary: require(path.join(cliLib, 'commands/summary')),
    save: require(path.join(cliLib, 'commands/save')),
    plan: require(path.join(cliLib, 'commands/plan')),
    fingerprint: require(path.join(cliLib, 'commands/fingerprint')),
    interactive: require(path.join(cliLib, 'commands/interactive')),
    update: require(path.join(cliLib, 'commands/update')),
    llmUsage: require(path.join(cliLib, 'commands/llm-usage'))
  }
};