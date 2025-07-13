#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { version } = require('./package.json');

// Import command handlers
const { runDefaultSummary } = require('./lib/commands/summary');
const { runSaveSummary } = require('./lib/commands/save');
const { runPlan } = require('./lib/commands/plan');
const { runUpdate } = require('./lib/commands/update');

// Global state for verbose/debug
global.verbose = false;
global.debug = false;

const program = new Command();

// Utility function for logging
function log(message, level = 'info') {
  if (level === 'debug' && !global.debug) return;
  if (level === 'verbose' && !global.verbose && !global.debug) return;
  
  const prefix = {
    error: chalk.red('ERROR:'),
    warn: chalk.yellow('WARN:'),
    info: chalk.blue('INFO:'),
    verbose: chalk.gray('VERBOSE:'),
    debug: chalk.gray('DEBUG:')
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
  .command('summary', { isDefault: true })
  .description('Generate ephemeral summary to stdout (default)')
  .option('-f, --format <format>', 'output format (markdown, json)', 'markdown')
  .option('--depth <n>', 'directory traversal depth', parseInt, 10)
  .option('--include <patterns>', 'include file patterns (comma-separated)')
  .option('--exclude <patterns>', 'exclude file patterns (comma-separated)')
  .option('--no-git', 'disable git integration')
  .action(async (options) => {
    try {
      await runDefaultSummary(options);
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
  .command('save')
  .description('Save persistent ARCHITECTURE.gsum.md file')
  .option('-f, --file <path>', 'output file path', 'ARCHITECTURE.gsum.md')
  .option('--force', 'force regeneration even if no changes')
  .option('--format <format>', 'output format (markdown, json)', 'markdown')
  .option('--depth <n>', 'directory traversal depth', parseInt, 10)
  .option('--include <patterns>', 'include file patterns (comma-separated)')
  .option('--exclude <patterns>', 'exclude file patterns (comma-separated)')
  .option('--no-git', 'disable git integration')
  .action(async (options) => {
    try {
      await runSaveSummary(options);
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

// Parse arguments
program.parse(process.argv);