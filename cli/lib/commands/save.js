const { SummaryGenerator } = require('../generator');

async function runSaveSummary(options) {
  const path = require('path');
  const targetDir = options.path ? path.resolve(options.path) : process.cwd();
  
  if (global.verbose) {
    global.log(`Saving summary to ${options.file} in ${targetDir}`, 'verbose');
  }

  const generator = new SummaryGenerator(options);
  
  try {
    const result = await generator.generate(targetDir, {
      mode: 'save',
      ...options
    });
    
    return result;
  } catch (error) {
    if (error.message === 'quota exceeded' && !options.fallback) {
      // Error message already shown by generator
      process.exit(1);
    }
    throw error;
  }
}

module.exports = { runSaveSummary };