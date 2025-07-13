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
      
      // Execute with heredoc
      const child = require('child_process').spawn('bash', ['-c', cmd], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Send the prompt via stdin
      child.stdin.write(prompt);
      child.stdin.end();

      child.on('close', (code) => {
        if (global.debug) {
          global.log(`Gemini exited with code: ${code}`, 'debug');
        }
        resolve(code);
      });

      child.on('error', (error) => {
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