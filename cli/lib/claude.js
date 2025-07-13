const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ClaudeClient {
  constructor() {
    this.checkClaudeInstalled();
  }

  checkClaudeInstalled() {
    try {
      execSync('which claude', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  async executeWithClaude(prompt, targetDir) {
    if (!this.checkClaudeInstalled()) {
      throw new Error('Claude CLI not found. Please install Claude Desktop first.');
    }

    const tempPromptFile = path.join(os.tmpdir(), `gsum-claude-prompt-${Date.now()}.txt`);
    
    try {
      // Write prompt to temp file
      await fs.writeFile(tempPromptFile, prompt);
      
      if (global.verbose) {
        global.log('Executing with Claude CLI...', 'verbose');
        global.log('WARNING: This will execute in the current directory context', 'verbose');
      }

      // Execute Claude with the prompt
      // Note: --dangerous flag allows file system access
      const result = execSync(
        `cd "${targetDir}" && claude --dangerous < "${tempPromptFile}"`,
        {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        }
      );

      return result;
    } catch (error) {
      if (error.message.includes('--dangerous')) {
        throw new Error(
          'Claude execution failed. The --dangerous flag may not be available in your Claude version.\n' +
          'Please use the fallback prompt method instead.'
        );
      }
      throw error;
    } finally {
      // Clean up temp file
      try {
        await fs.unlink(tempPromptFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

module.exports = { ClaudeClient };