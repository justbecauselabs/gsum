const readline = require('readline');
const { runDefaultSummary } = require('./summary');
const { runSaveSummary } = require('./save');

class InteractiveSession {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.options = {};
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async yesNo(prompt, defaultValue = true) {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.question(`${prompt} [${defaultText}] `);
    
    if (!answer) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  async select(prompt, choices, defaultIndex = 0) {
    console.log(prompt);
    choices.forEach((choice, i) => {
      console.log(`  ${i + 1}. ${choice}`);
    });
    
    const answer = await this.question(`Choose [1-${choices.length}] (default: ${defaultIndex + 1}): `);
    const index = parseInt(answer) - 1;
    
    if (isNaN(index) || index < 0 || index >= choices.length) {
      return defaultIndex;
    }
    return index;
  }

  async run() {
    console.log('\n🎮 gsum Interactive Mode\n');

    // Mode selection
    const mode = await this.select(
      'What would you like to do?',
      ['Generate ephemeral summary (to stdout)', 'Save persistent summary (to file)'],
      0
    );
    this.options.mode = mode === 0 ? 'ephemeral' : 'save';

    // Path selection
    const customPath = await this.yesNo('Analyze a specific directory?', false);
    if (customPath) {
      this.options.path = await this.question('Enter path: ');
    }

    // Context level
    const contextLevel = await this.select(
      'Select context level:',
      [
        'minimal (2-3k words) - Quick context',
        'standard (5-7k words) - Balanced detail',
        'comprehensive (10k+ words) - Full documentation'
      ],
      this.options.mode === 'save' ? 2 : 1
    );
    this.options.contextLevel = ['minimal', 'standard', 'comprehensive'][contextLevel];

    // Focus area
    const useFocus = await this.yesNo('Focus on a specific area?', false);
    if (useFocus) {
      const focusArea = await this.select(
        'Select focus area:',
        [
          'frontend - Components and UI',
          'api - Backend and endpoints',
          'database - Models and schemas',
          'testing - Test structure',
          'deployment - CI/CD and infrastructure',
          'tooling - Build and configuration',
          'documentation - Docs and guides'
        ],
        0
      );
      this.options.focus = ['frontend', 'api', 'database', 'testing', 'deployment', 'tooling', 'documentation'][focusArea];
    }

    // Advanced options
    const advancedOptions = await this.yesNo('Configure advanced options?', false);
    if (advancedOptions) {
      // Depth
      const depthAnswer = await this.question('Max directory depth (default: 10): ');
      if (depthAnswer) {
        this.options.depth = parseInt(depthAnswer);
      }

      // Include patterns
      const includePatterns = await this.question('Include patterns (comma-separated, e.g., *.js,*.ts): ');
      if (includePatterns) {
        this.options.include = includePatterns;
      }

      // Exclude patterns
      const excludePatterns = await this.question('Exclude patterns (comma-separated): ');
      if (excludePatterns) {
        this.options.exclude = excludePatterns;
      }

      // Git integration
      this.options.git = await this.yesNo('Use git integration?', true);
    }

    // Save-specific options
    if (this.options.mode === 'save') {
      const customFile = await this.yesNo('Use custom output filename?', false);
      if (customFile) {
        this.options.file = await this.question('Enter filename (default: ARCHITECTURE.gsum.md): ');
      }

      this.options.force = await this.yesNo('Force regeneration even if no changes?', false);
    }

    // Summary of choices
    console.log('\n📋 Configuration Summary:');
    console.log(`- Mode: ${this.options.mode}`);
    if (this.options.path) console.log(`- Path: ${this.options.path}`);
    console.log(`- Context level: ${this.options.contextLevel}`);
    if (this.options.focus) console.log(`- Focus area: ${this.options.focus}`);
    if (this.options.depth) console.log(`- Max depth: ${this.options.depth}`);
    if (this.options.include) console.log(`- Include: ${this.options.include}`);
    if (this.options.exclude) console.log(`- Exclude: ${this.options.exclude}`);
    if (this.options.file) console.log(`- Output file: ${this.options.file}`);
    console.log('');

    const proceed = await this.yesNo('Proceed with these settings?', true);
    if (!proceed) {
      console.log('Cancelled.');
      this.rl.close();
      return;
    }

    this.rl.close();

    // Execute the command
    console.log('\n🚀 Generating summary...\n');
    
    if (this.options.mode === 'ephemeral') {
      await runDefaultSummary(this.options);
    } else {
      await runSaveSummary(this.options);
    }
  }
}

async function runInteractive() {
  const session = new InteractiveSession();
  try {
    await session.run();
  } catch (error) {
    console.error('Interactive session error:', error.message);
    process.exit(1);
  }
}

module.exports = { runInteractive };