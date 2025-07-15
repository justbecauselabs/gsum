const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { runDefaultSummary } = require('./summary');
const { runSaveSummary } = require('./save');

class InteractiveSession {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.options = {};
    
    // Color constants for better UX
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m'
    };
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async yesNo(prompt, defaultValue = true) {
    const defaultText = defaultValue ? `${this.colors.green}Y${this.colors.reset}/n` : `y/${this.colors.green}N${this.colors.reset}`;
    const answer = await this.question(`${this.colors.cyan}?${this.colors.reset} ${prompt} [${defaultText}] `);
    
    if (!answer.trim()) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  async select(prompt, choices, defaultIndex = 0) {
    console.log(`\n${this.colors.cyan}?${this.colors.reset} ${this.colors.bright}${prompt}${this.colors.reset}`);
    choices.forEach((choice, i) => {
      const isDefault = i === defaultIndex;
      const prefix = isDefault ? `${this.colors.green}❯${this.colors.reset}` : ' ';
      const number = isDefault ? `${this.colors.green}${i + 1}${this.colors.reset}` : `${this.colors.gray}${i + 1}${this.colors.reset}`;
      const text = isDefault ? `${this.colors.bright}${choice}${this.colors.reset}` : choice;
      console.log(`${prefix} ${number}. ${text}`);
    });
    
    const defaultHint = `${this.colors.gray}(default: ${defaultIndex + 1})${this.colors.reset}`;
    const answer = await this.question(`\n${this.colors.yellow}→${this.colors.reset} Choose [1-${choices.length}] ${defaultHint}: `);
    
    if (!answer.trim()) {
      return defaultIndex;
    }
    
    const index = parseInt(answer) - 1;
    
    if (isNaN(index) || index < 0 || index >= choices.length) {
      console.log(`${this.colors.yellow}⚠${this.colors.reset}  Invalid choice. Using default: ${this.colors.green}${choices[defaultIndex]}${this.colors.reset}`);
      return defaultIndex;
    }
    return index;
  }

  async run() {
    // Clear screen and show header
    console.clear();
    console.log(`${this.colors.bright}${this.colors.magenta}`);
    console.log('╭─────────────────────────────────────────────────────────────╮');
    console.log('│                                                             │');
    console.log('│               🎮 gsum Interactive Mode                      │');
    console.log('│                                                             │');
    console.log('│          AI-Powered Codebase Summarization Tool            │');
    console.log('│                                                             │');
    console.log('╰─────────────────────────────────────────────────────────────╯');
    console.log(this.colors.reset);
    console.log(`${this.colors.gray}Let's configure the perfect summary for your codebase!${this.colors.reset}\n`);

    // Mode selection
    const mode = await this.select(
      'What would you like to do?',
      [
        `${this.colors.cyan}Generate ephemeral summary${this.colors.reset} ${this.colors.gray}(prints to terminal)${this.colors.reset}`,
        `${this.colors.blue}Save persistent summary${this.colors.reset} ${this.colors.gray}(creates ARCHITECTURE.gsum.md)${this.colors.reset}`
      ],
      0
    );
    this.options.mode = mode === 0 ? 'ephemeral' : 'save';
    console.log(`${this.colors.green}✓${this.colors.reset} Mode: ${this.options.mode === 'ephemeral' ? 'Ephemeral' : 'Save persistent'}`);

    // Path selection
    const customPath = await this.yesNo('Analyze a specific directory?', false);
    if (customPath) {
      let enteredPath;
      do {
        enteredPath = await this.question(`${this.colors.yellow}→${this.colors.reset} Enter path ${this.colors.gray}(relative to current directory)${this.colors.reset}: `);
        if (!enteredPath.trim()) {
          console.log(`${this.colors.red}✗${this.colors.reset} Please enter a valid path.`);
          continue;
        }
        
        const resolvedPath = path.resolve(enteredPath);
        if (fs.existsSync(resolvedPath)) {
          this.options.path = enteredPath;
          console.log(`${this.colors.green}✓${this.colors.reset} Path: ${this.colors.bright}${enteredPath}${this.colors.reset}`);
          break;
        } else {
          console.log(`${this.colors.red}✗${this.colors.reset} Path '${this.colors.bright}${enteredPath}${this.colors.reset}' does not exist. Please try again.`);
        }
      } while (true);
    } else {
      console.log(`${this.colors.green}✓${this.colors.reset} Path: ${this.colors.bright}current directory${this.colors.reset}`);
    }

    // Context level
    const contextLevel = await this.select(
      'Select context level:',
      [
        `${this.colors.yellow}minimal${this.colors.reset} ${this.colors.gray}(2-3k words) - Quick context for AI assistants${this.colors.reset}`,
        `${this.colors.blue}standard${this.colors.reset} ${this.colors.gray}(5-7k words) - Balanced detail for development${this.colors.reset}`,
        `${this.colors.magenta}comprehensive${this.colors.reset} ${this.colors.gray}(10k+ words) - Full documentation${this.colors.reset}`
      ],
      this.options.mode === 'save' ? 2 : 1
    );
    this.options.contextLevel = ['minimal', 'standard', 'comprehensive'][contextLevel];
    console.log(`${this.colors.green}✓${this.colors.reset} Context level: ${this.colors.bright}${this.options.contextLevel}${this.colors.reset}`);

    // Focus area
    const useFocus = await this.yesNo('Focus on a specific area?', false);
    if (useFocus) {
      const focusArea = await this.select(
        'Select focus area:',
        [
          `${this.colors.cyan}frontend${this.colors.reset} ${this.colors.gray}- Components and UI${this.colors.reset}`,
          `${this.colors.blue}api${this.colors.reset} ${this.colors.gray}- Backend and endpoints${this.colors.reset}`,
          `${this.colors.green}database${this.colors.reset} ${this.colors.gray}- Models and schemas${this.colors.reset}`,
          `${this.colors.red}authentication${this.colors.reset} ${this.colors.gray}- User auth and security${this.colors.reset}`,
          `${this.colors.red}security${this.colors.reset} ${this.colors.gray}- Security measures and validation${this.colors.reset}`,
          `${this.colors.yellow}performance${this.colors.reset} ${this.colors.gray}- Optimization and monitoring${this.colors.reset}`,
          `${this.colors.magenta}configuration${this.colors.reset} ${this.colors.gray}- Settings and environment${this.colors.reset}`,
          `${this.colors.cyan}logging${this.colors.reset} ${this.colors.gray}- Logging and debugging${this.colors.reset}`,
          `${this.colors.blue}infrastructure${this.colors.reset} ${this.colors.gray}- Deployment and infrastructure${this.colors.reset}`,
          `${this.colors.green}testing${this.colors.reset} ${this.colors.gray}- Test structure and coverage${this.colors.reset}`,
          `${this.colors.yellow}deployment${this.colors.reset} ${this.colors.gray}- CI/CD and deployment${this.colors.reset}`,
          `${this.colors.magenta}tooling${this.colors.reset} ${this.colors.gray}- Build tools and configuration${this.colors.reset}`,
          `${this.colors.cyan}documentation${this.colors.reset} ${this.colors.gray}- Docs and guides${this.colors.reset}`
        ],
        0
      );
      this.options.focus = ['frontend', 'api', 'database', 'authentication', 'security', 'performance', 'configuration', 'logging', 'infrastructure', 'testing', 'deployment', 'tooling', 'documentation'][focusArea];
      console.log(`${this.colors.green}✓${this.colors.reset} Focus area: ${this.colors.bright}${this.options.focus}${this.colors.reset}`);
    } else {
      console.log(`${this.colors.green}✓${this.colors.reset} Focus area: ${this.colors.bright}all areas${this.colors.reset}`);
    }

    // Advanced options
    console.log(`\n${this.colors.dim}─────────────────────────────────────────────────────${this.colors.reset}`);
    const advancedOptions = await this.yesNo('Configure advanced options?', false);
    if (advancedOptions) {
      console.log(`\n${this.colors.dim}Advanced Configuration:${this.colors.reset}`);
      
      // Depth
      const depthAnswer = await this.question(`${this.colors.yellow}→${this.colors.reset} Max directory depth ${this.colors.gray}(1-50, default: 10)${this.colors.reset}: `);
      if (depthAnswer.trim()) {
        const depth = parseInt(depthAnswer);
        if (isNaN(depth) || depth < 1 || depth > 50) {
          console.log(`${this.colors.yellow}⚠${this.colors.reset}  Invalid depth. Must be between 1 and 50. Using default: 10`);
        } else {
          this.options.depth = depth;
          console.log(`${this.colors.green}✓${this.colors.reset} Directory depth: ${this.colors.bright}${depth}${this.colors.reset}`);
        }
      }

      // Include patterns
      const includePatterns = await this.question(`${this.colors.yellow}→${this.colors.reset} Include patterns ${this.colors.gray}(comma-separated, e.g., *.js,*.ts)${this.colors.reset}: `);
      if (includePatterns.trim()) {
        const patterns = includePatterns.split(',').map(p => p.trim()).filter(p => p);
        if (patterns.length > 0) {
          this.options.include = patterns.join(',');
          console.log(`${this.colors.green}✓${this.colors.reset} Include patterns: ${this.colors.bright}${this.options.include}${this.colors.reset}`);
        }
      }

      // Exclude patterns
      const excludePatterns = await this.question(`${this.colors.yellow}→${this.colors.reset} Exclude patterns ${this.colors.gray}(comma-separated)${this.colors.reset}: `);
      if (excludePatterns.trim()) {
        const patterns = excludePatterns.split(',').map(p => p.trim()).filter(p => p);
        if (patterns.length > 0) {
          this.options.exclude = patterns.join(',');
          console.log(`${this.colors.green}✓${this.colors.reset} Exclude patterns: ${this.colors.bright}${this.options.exclude}${this.colors.reset}`);
        }
      }

      // Git integration
      this.options.git = await this.yesNo('Use git integration?', true);
      console.log(`${this.colors.green}✓${this.colors.reset} Git integration: ${this.colors.bright}${this.options.git ? 'enabled' : 'disabled'}${this.colors.reset}`);
    } else {
      console.log(`${this.colors.green}✓${this.colors.reset} Using default advanced settings`);
    }

    // Save-specific options
    if (this.options.mode === 'save') {
      console.log(`\n${this.colors.dim}─────────────────────────────────────────────────────${this.colors.reset}`);
      console.log(`${this.colors.dim}Save Options:${this.colors.reset}`);
      
      const customFile = await this.yesNo('Use custom output filename?', false);
      if (customFile) {
        const filename = await this.question(`${this.colors.yellow}→${this.colors.reset} Enter filename ${this.colors.gray}(default: ARCHITECTURE.gsum.md)${this.colors.reset}: `);
        if (filename.trim()) {
          this.options.file = filename;
          console.log(`${this.colors.green}✓${this.colors.reset} Output file: ${this.colors.bright}${filename}${this.colors.reset}`);
        }
      } else {
        console.log(`${this.colors.green}✓${this.colors.reset} Output file: ${this.colors.bright}ARCHITECTURE.gsum.md${this.colors.reset}`);
      }

      this.options.force = await this.yesNo('Force regeneration even if no changes?', false);
      console.log(`${this.colors.green}✓${this.colors.reset} Force regeneration: ${this.colors.bright}${this.options.force ? 'yes' : 'no'}${this.colors.reset}`);
    }

    // Summary of choices
    console.log(`\n${this.colors.bright}${this.colors.magenta}📋 Configuration Summary${this.colors.reset}`);
    console.log(`${this.colors.dim}╭─────────────────────────────────────────────────────────────╮${this.colors.reset}`);
    console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Mode:${this.colors.reset} ${this.colors.bright}${this.options.mode}${this.colors.reset}`);
    if (this.options.path) console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Path:${this.colors.reset} ${this.colors.bright}${this.options.path}${this.colors.reset}`);
    console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Context level:${this.colors.reset} ${this.colors.bright}${this.options.contextLevel}${this.colors.reset}`);
    if (this.options.focus) console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Focus area:${this.colors.reset} ${this.colors.bright}${this.options.focus}${this.colors.reset}`);
    if (this.options.depth) console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Max depth:${this.colors.reset} ${this.colors.bright}${this.options.depth}${this.colors.reset}`);
    if (this.options.include) console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Include:${this.colors.reset} ${this.colors.bright}${this.options.include}${this.colors.reset}`);
    if (this.options.exclude) console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Exclude:${this.colors.reset} ${this.colors.bright}${this.options.exclude}${this.colors.reset}`);
    if (this.options.file) console.log(`${this.colors.dim}│${this.colors.reset} ${this.colors.cyan}Output file:${this.colors.reset} ${this.colors.bright}${this.options.file}${this.colors.reset}`);
    console.log(`${this.colors.dim}╰─────────────────────────────────────────────────────────────╯${this.colors.reset}\n`);

    const proceed = await this.yesNo('Proceed with these settings?', true);
    if (!proceed) {
      console.log(`\n${this.colors.yellow}⚠${this.colors.reset}  ${this.colors.dim}Operation cancelled.${this.colors.reset}`);
      this.rl.close();
      return;
    }

    this.rl.close();

    // Execute the command
    console.log(`\n${this.colors.green}🚀 Generating summary...${this.colors.reset}`);
    console.log(`${this.colors.dim}This may take a few moments depending on your codebase size.${this.colors.reset}\n`);
    console.log(`${this.colors.dim}─────────────────────────────────────────────────────${this.colors.reset}\n`);
    
    if (this.options.mode === 'ephemeral') {
      await runDefaultSummary(this.options);
    } else {
      await runSaveSummary(this.options);
    }
  }
}

async function runInteractive() {
  const session = new InteractiveSession();
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n\n❌ Interactive mode cancelled.');
    if (session.rl && !session.rl.closed) {
      session.rl.close();
    }
    process.exit(0);
  });
  
  try {
    await session.run();
  } catch (error) {
    // Ensure readline is closed on error
    if (session.rl && !session.rl.closed) {
      session.rl.close();
    }
    console.error(`\n❌ Interactive session error: ${error.message}`);
    if (global.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

module.exports = { runInteractive };