const { SummaryGenerator } = require('../generator');

async function runPlan(task, options) {
  const targetDir = process.cwd();
  
  if (global.verbose) {
    global.log(`Generating implementation plan for: ${task}`, 'verbose');
  }

  const generator = new SummaryGenerator({ ...options, task });
  
  try {
    const result = await generator.generate(targetDir, {
      mode: 'plan',
      task,
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

module.exports = { runPlan };