const { SummaryGenerator } = require('../generator');

async function runDefaultSummary(options) {
  const targetDir = process.cwd();
  
  if (global.verbose) {
    global.log(`Running ephemeral summary in ${targetDir}`, 'verbose');
  }

  const generator = new SummaryGenerator(options);
  
  try {
    const result = await generator.generate(targetDir, {
      mode: 'ephemeral',
      ...options
    });
    
    // Result is already printed by generator
    return result;
  } catch (error) {
    if (error.message === 'quota exceeded' && !options.fallback && !options.claudeExecute) {
      // Error message already shown by generator
      process.exit(1);
    }
    throw error;
  }
}

module.exports = { runDefaultSummary };