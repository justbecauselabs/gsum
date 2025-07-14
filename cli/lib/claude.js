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
      
      if (global.verbose || global.debug) {
        global.log('🤖 Starting Claude CLI execution...', 'info');
        global.log(`📍 Working directory: ${targetDir}`, 'verbose');
        global.log(`📝 Prompt length: ${prompt.length} characters`, 'verbose');
        global.log('⚠️  WARNING: This will execute in the current directory context', 'warn');
      }

      // Execute Claude with the prompt using spawn for better control
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const cmd = `cd "${targetDir}" && claude --dangerous < "${tempPromptFile}"`;
        const child = spawn('bash', ['-c', cmd], {
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        
        let output = '';
        let errorOutput = '';
        let startTime = Date.now();
        
        // Set timeout (5 minutes default, configurable via env)
        const timeout = parseInt(process.env.GSUM_TIMEOUT || '300000', 10);
        let timeoutId;
        let progressInterval;
        
        if (timeout > 0) {
          timeoutId = setTimeout(() => {
            if (global.verbose || global.debug) {
              global.log(`⏱️ Timeout reached after ${timeout/1000}s, terminating Claude...`, 'warn');
            }
            child.kill('SIGTERM');
            reject(new Error(`Claude execution timed out after ${timeout/1000} seconds`));
          }, timeout);
        }
        
        // Progress indicator
        if (global.verbose || global.debug) {
          let dots = 0;
          progressInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const dotStr = '.'.repeat((dots % 4) + 1).padEnd(4, ' ');
            process.stderr.write(`\r⏳ Claude is processing${dotStr} (${elapsed}s)`);
            dots++;
          }, 500);
        }
        
        child.stdout.on('data', (data) => {
          output += data.toString();
          // Show real-time output if verbose
          if (global.verbose) {
            process.stderr.write(data);
          }
        });
        
        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        child.on('close', (code) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (progressInterval) {
            clearInterval(progressInterval);
            process.stderr.write('\r' + ' '.repeat(50) + '\r'); // Clear progress line
          }
          
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          if (global.verbose || global.debug) {
            global.log(`✅ Claude completed in ${elapsed}s with code: ${code}`, 'info');
          }
          
          if (code !== 0) {
            if (errorOutput.includes('--dangerous')) {
              reject(new Error(
                'Claude execution failed. The --dangerous flag may not be available in your Claude version.\n' +
                'Please use the fallback prompt method instead.'
              ));
            } else {
              reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
            }
          } else {
            resolve(output);
          }
        });
        
        child.on('error', (error) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (progressInterval) {
            clearInterval(progressInterval);
            process.stderr.write('\r' + ' '.repeat(50) + '\r');
          }
          reject(error);
        });
      });
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