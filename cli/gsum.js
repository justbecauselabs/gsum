#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const { version } = require('./package.json');

// Import command handlers
const { runDefaultSummary } = require('./lib/commands/summary');
const { runSaveSummary } = require('./lib/commands/save');
const { runPlan } = require('./lib/commands/plan');
const { runUpdate } = require('./lib/commands/update');
const { runLLMUsage } = require('./lib/commands/llm-usage');
const { runInteractive } = require('./lib/commands/interactive');
const { runFingerprint } = require('./lib/commands/fingerprint');

// Global state for verbose/debug
global.verbose = false;
global.debug = false;

const program = new Command();

// Utility function for logging
function log(message, level = 'info') {
  if (level === 'debug' && !global.debug) return;
  if (level === 'verbose' && !global.verbose && !global.debug) return;
  
  const prefix = {
    error: '\x1b[31mERROR:\x1b[0m',
    warn: '\x1b[33mWARN:\x1b[0m',
    info: '\x1b[34mINFO:\x1b[0m',
    verbose: '\x1b[90mVERBOSE:\x1b[0m',
    debug: '\x1b[90mDEBUG:\x1b[0m'
  };
  
  console.error(`${prefix[level] || ''} ${message}`);
}

global.log = log;

program
  .name('gsum')
  .description('AI-powered codebase summarization tool')
  .version(version)
  .option('-v, --verbose', 'enable verbose output')
  .option('-d, --debug', 'enable debug mode')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    global.verbose = options.verbose || false;
    global.debug = options.debug || false;
    
    if (global.debug) {
      log('Debug mode enabled', 'debug');
    }
  });

// Default command - ephemeral summary
program
  .command('summary [path]', { isDefault: true })
  .description('Generate ephemeral summary to stdout (default)')
  .option('-f, --format <format>', 'output format (markdown, json)', 'markdown')
  .option('--depth <n>', 'directory traversal depth', parseInt, 5)
  .option('--include <patterns>', 'include file patterns (comma-separated)')
  .option('--exclude <patterns>', 'exclude file patterns (comma-separated)')
  .option('--no-git', 'disable git integration')
  .option('--context-level <level>', 'context level: minimal, standard, comprehensive', 'standard')
  .option('--focus <area>', 'focus on specific area: frontend, api, database, testing, deployment, tooling, documentation')
  .option('--smart-files <n>', 'include N most relevant files based on git/import analysis', parseInt)
  .option('--fallback', 'generate Claude fallback prompt on Gemini quota error')
  .option('--claude-execute', 'try to execute with Claude CLI on Gemini quota error')
  .option('--claude-only', 'generate summary directly without using Gemini (works in Claude Code)')
  .option('--claude-optimized', 'generate token-optimized context for Claude Code (auto-enabled in Claude)')
  .action(async (path, options) => {
    try {
      // Validate context level
      const validLevels = ['minimal', 'standard', 'comprehensive'];
      if (options.contextLevel && !validLevels.includes(options.contextLevel)) {
        throw new Error(`Invalid context level: ${options.contextLevel}. Must be one of: ${validLevels.join(', ')}`);
      }
      
      // Validate focus area
      const validFocusAreas = ['frontend', 'api', 'database', 'testing', 'deployment', 'tooling', 'documentation'];
      if (options.focus && !validFocusAreas.includes(options.focus)) {
        throw new Error(`Invalid focus area: ${options.focus}. Must be one of: ${validFocusAreas.join(', ')}`);
      }
      
      await runDefaultSummary({ ...options, path });
    } catch (error) {
      log(error.message, 'error');
      if (global.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Save command - persistent summary
program
  .command('save [path]')
  .description('Save persistent ARCHITECTURE.gsum.md file')
  .option('-f, --file <path>', 'output file path', 'ARCHITECTURE.gsum.md')
  .option('--force', 'force regeneration even if no changes')
  .option('--format <format>', 'output format (markdown, json)', 'markdown')
  .option('--depth <n>', 'directory traversal depth', parseInt, 5)
  .option('--include <patterns>', 'include file patterns (comma-separated)')
  .option('--exclude <patterns>', 'exclude file patterns (comma-separated)')
  .option('--no-git', 'disable git integration')
  .option('--context-level <level>', 'context level: minimal, standard, comprehensive', 'comprehensive')
  .option('--focus <area>', 'focus on specific area: frontend, api, database, testing, deployment, tooling, documentation')
  .option('--smart-files <n>', 'include N most relevant files based on git/import analysis', parseInt)
  .option('--claude-only', 'generate summary directly without using Gemini (works in Claude Code)')
  .option('--claude-optimized', 'also generate Claude-optimized context cache in .gsum/')
  .action(async (path, options) => {
    try {
      // Validate context level
      const validLevels = ['minimal', 'standard', 'comprehensive'];
      if (options.contextLevel && !validLevels.includes(options.contextLevel)) {
        throw new Error(`Invalid context level: ${options.contextLevel}. Must be one of: ${validLevels.join(', ')}`);
      }
      
      // Validate focus area
      const validFocusAreas = ['frontend', 'api', 'database', 'testing', 'deployment', 'tooling', 'documentation'];
      if (options.focus && !validFocusAreas.includes(options.focus)) {
        throw new Error(`Invalid focus area: ${options.focus}. Must be one of: ${validFocusAreas.join(', ')}`);
      }
      
      await runSaveSummary({ ...options, path });
    } catch (error) {
      log(error.message, 'error');
      if (global.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Plan command - implementation planning
program
  .command('plan <task>')
  .description('Generate implementation plan for a specific task')
  .option('-c, --context <file>', 'additional context file')
  .option('-f, --format <format>', 'output format (markdown, json)', 'markdown')
  .action(async (task, options) => {
    try {
      await runPlan(task, options);
    } catch (error) {
      log(error.message, 'error');
      if (global.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Update command - self-update
program
  .command('update')
  .description('Update gsum to the latest version')
  .option('--branch <branch>', 'git branch to update from', 'main')
  .action(async (options) => {
    try {
      await runUpdate(options);
    } catch (error) {
      log(error.message, 'error');
      if (global.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Version command with more details
program
  .command('version')
  .description('Show detailed version information')
  .action(() => {
    console.log(`gsum CLI v${version}`);
    console.log(`Node.js ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    console.log(`Installation: ${__dirname}`);
  });

// LLM usage guide
program
  .command('llm-usage')
  .description('Show usage guide for LLMs')
  .action(async () => {
    try {
      await runLLMUsage();
    } catch (error) {
      log(error.message, 'error');
      if (global.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Interactive mode
program
  .command('interactive')
  .alias('i')
  .description('Interactive mode - guided configuration')
  .action(async () => {
    try {
      await runInteractive();
    } catch (error) {
      log(error.message, 'error');
      if (global.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Fingerprint command
program
  .command('fingerprint [path]')
  .alias('fp')
  .description('Generate ultra-compressed project overview')
  .option('-f, --format <format>', 'output format (text, json)', 'text')
  .action(async (path, options) => {
    try {
      await runFingerprint({ ...options, path });
    } catch (error) {
      log(error.message, 'error');
      if (global.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);