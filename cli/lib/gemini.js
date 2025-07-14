const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class GeminiClient {
  constructor() {
    this.checkGeminiInstalled();
  }

  checkGeminiInstalled() {
    try {
      execSync('which gemini', { stdio: 'pipe' });
    } catch {
      throw new Error('Gemini CLI not found. Please install it first.');
    }
  }

  async generate(prompt, targetDir) {
    const tempOutput = path.join(os.tmpdir(), `gsum-output-${Date.now()}.txt`);
    const tempError = path.join(os.tmpdir(), `gsum-error-${Date.now()}.txt`);

    try {
      if (global.debug) {
        global.log(`Calling Gemini in directory: ${targetDir}`, 'debug');
      }

      // Execute Gemini with the prompt
      const result = await this.executeGemini(prompt, targetDir, tempOutput, tempError);
      
      // Check for errors
      const errorContent = await this.readFile(tempError);
      if (errorContent) {
        await this.handleGeminiError(errorContent);
      }

      // Check for expected output file (DIRECTORY_SUMMARY.md)
      const summaryPath = path.join(targetDir, 'DIRECTORY_SUMMARY.md');
      try {
        const summaryContent = await fs.readFile(summaryPath, 'utf8');
        // Clean up the generated file
        await fs.unlink(summaryPath);
        return summaryContent;
      } catch {
        // If no file was created, check stdout
        const stdoutContent = await this.readFile(tempOutput);
        if (stdoutContent && stdoutContent.trim()) {
          return stdoutContent;
        }
      }

      throw new Error('No output generated from Gemini');
    } finally {
      // Cleanup temp files
      await this.cleanup(tempOutput, tempError);
    }
  }

  async executeGemini(prompt, targetDir, tempOutput, tempError) {
    return new Promise((resolve, reject) => {
      // Build the command
      const cmd = `cd "${targetDir}" && gemini --yolo > "${tempOutput}" 2> "${tempError}"`;
      
      if (global.verbose || global.debug) {
        global.log(`🚀 Starting Gemini execution...`, 'info');
        global.log(`📍 Working directory: ${targetDir}`, 'verbose');
        global.log(`📝 Prompt length: ${prompt.length} characters`, 'verbose');
      }
      
      // Execute with heredoc
      const child = require('child_process').spawn('bash', ['-c', cmd], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Set timeout (5 minutes default, configurable via env)
      const timeout = parseInt(process.env.GSUM_TIMEOUT || '300000', 10);
      let timeoutId;
      let startTime = Date.now();
      let progressInterval;
      
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          if (global.verbose || global.debug) {
            global.log(`⏱️ Timeout reached after ${timeout/1000}s, terminating Gemini...`, 'warn');
          }
          child.kill('SIGTERM');
          reject(new Error(`Gemini execution timed out after ${timeout/1000} seconds`));
        }, timeout);
      }
      
      // Progress indicator
      if (global.verbose || global.debug) {
        let dots = 0;
        progressInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const dotStr = '.'.repeat((dots % 4) + 1).padEnd(4, ' ');
          process.stderr.write(`\r⏳ Gemini is processing${dotStr} (${elapsed}s)`);
          dots++;
        }, 500);
      }

      // Send the prompt via stdin
      child.stdin.write(prompt);
      child.stdin.end();

      child.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (progressInterval) {
          clearInterval(progressInterval);
          process.stderr.write('\r' + ' '.repeat(50) + '\r'); // Clear progress line
        }
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (global.verbose || global.debug) {
          global.log(`✅ Gemini completed in ${elapsed}s with code: ${code}`, 'info');
        }
        resolve(code);
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
  }

  async handleGeminiError(errorContent) {
    const errorLower = errorContent.toLowerCase();

    // Check for quota exceeded
    if (errorLower.includes('quota exceeded') || 
        errorLower.includes('resource_exhausted') || 
        errorLower.includes('ratelimitexceeded')) {
      throw new Error('quota exceeded');
    }

    // Check for authentication errors
    if (errorLower.includes('authentication') || 
        errorLower.includes('unauthorized') || 
        errorLower.includes('permission denied')) {
      throw new Error('Authentication failed. Please check your Gemini API credentials.');
    }

    // Check for network errors
    if (errorLower.includes('network') || 
        errorLower.includes('connection') || 
        errorLower.includes('timeout')) {
      throw new Error('Network error. Please check your internet connection.');
    }

    // Generic error
    if (errorLower.includes('error') || 
        errorLower.includes('failed') || 
        errorLower.includes('exception')) {
      if (global.debug) {
        global.log(`Gemini error: ${errorContent}`, 'debug');
      }
      throw new Error(`Gemini API error: ${errorContent.split('\n')[0]}`);
    }
  }

  async readFile(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch {
      return '';
    }
  }

  async cleanup(...files) {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

module.exports = { GeminiClient };