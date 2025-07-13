const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Constants
const DIFF_THRESHOLD = 500; // Lines of diff before we consider it "non-trivial"
const GIT_HASH_PATTERN = /^<!-- git-hash: (.+) -->$/m;

class GitIntegration {
  constructor(targetDir) {
    this.targetDir = targetDir;
    this.isGitRepo = this.checkIfGitRepo();
  }

  checkIfGitRepo() {
    try {
      execSync('git rev-parse --git-dir', {
        cwd: this.targetDir,
        stdio: 'pipe'
      });
      return true;
    } catch {
      return false;
    }
  }

  getCurrentHash() {
    if (!this.isGitRepo) return null;
    
    try {
      const hash = execSync('git rev-parse HEAD', {
        cwd: this.targetDir,
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      
      if (global.debug) {
        global.log(`Current git hash: ${hash}`, 'debug');
      }
      
      return hash;
    } catch (error) {
      if (global.debug) {
        global.log(`Error getting git hash: ${error.message}`, 'debug');
      }
      return null;
    }
  }

  async getStoredHash(summaryFile) {
    try {
      const content = await fs.readFile(summaryFile, 'utf8');
      const match = content.match(GIT_HASH_PATTERN);
      
      if (match) {
        const hash = match[1];
        if (global.debug) {
          global.log(`Stored git hash: ${hash}`, 'debug');
        }
        return hash;
      }
    } catch (error) {
      if (global.debug) {
        global.log(`Error reading stored hash: ${error.message}`, 'debug');
      }
    }
    
    return null;
  }

  async addHashToFile(summaryFile, hash) {
    if (!hash) return;
    
    try {
      const content = await fs.readFile(summaryFile, 'utf8');
      
      // Remove existing hash if present
      const updatedContent = content.replace(GIT_HASH_PATTERN, '').trimEnd();
      
      // Add new hash
      const finalContent = `${updatedContent}\n\n<!-- git-hash: ${hash} -->`;
      
      await fs.writeFile(summaryFile, finalContent);
      
      if (global.verbose) {
        global.log(`Added git hash to ${summaryFile}`, 'verbose');
      }
    } catch (error) {
      if (global.debug) {
        global.log(`Error adding hash to file: ${error.message}`, 'debug');
      }
    }
  }

  areCommitsConnected(oldHash, currentHash) {
    if (!this.isGitRepo || !oldHash || !currentHash) return false;
    
    try {
      execSync(`git merge-base --is-ancestor "${oldHash}" "${currentHash}"`, {
        cwd: this.targetDir,
        stdio: 'pipe'
      });
      return true;
    } catch {
      // Check the reverse - maybe we're on a different branch
      try {
        execSync(`git merge-base --is-ancestor "${currentHash}" "${oldHash}"`, {
          cwd: this.targetDir,
          stdio: 'pipe'
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  isDiffTrivial(oldHash, currentHash) {
    if (!this.isGitRepo || !oldHash || !currentHash) return false;
    
    try {
      // Get the diff statistics
      const diffStats = execSync(
        `git diff "${oldHash}..${currentHash}" --numstat | awk '{added+=$1; deleted+=$2} END {print added+deleted}'`,
        {
          cwd: this.targetDir,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      ).trim();
      
      const totalLines = parseInt(diffStats, 10) || 0;
      
      if (global.verbose) {
        global.log(`Git diff: ${totalLines} lines changed (threshold: ${DIFF_THRESHOLD})`, 'verbose');
      }
      
      return totalLines < DIFF_THRESHOLD;
    } catch (error) {
      if (global.debug) {
        global.log(`Error checking diff: ${error.message}`, 'debug');
      }
      return false;
    }
  }

  async shouldRegenerate(summaryFile, options = {}) {
    // Force regeneration if requested
    if (options.force) {
      if (global.verbose) {
        global.log('Force flag set, will regenerate', 'verbose');
      }
      return true;
    }

    // If no git repo, check if file exists
    if (!this.isGitRepo) {
      try {
        await fs.access(summaryFile);
        if (global.verbose) {
          global.log('Not a git repo, but summary exists - skipping regeneration', 'verbose');
        }
        return false;
      } catch {
        if (global.verbose) {
          global.log('Not a git repo and no summary exists - will generate', 'verbose');
        }
        return true;
      }
    }

    // Check if summary file exists
    try {
      await fs.access(summaryFile);
    } catch {
      if (global.verbose) {
        global.log('Summary file does not exist - will generate', 'verbose');
      }
      return true;
    }

    // Get current and stored hashes
    const currentHash = this.getCurrentHash();
    const storedHash = await this.getStoredHash(summaryFile);

    // No stored hash means we should regenerate
    if (!storedHash) {
      if (global.verbose) {
        global.log('No stored git hash found - will regenerate', 'verbose');
      }
      return true;
    }

    // Same hash means no changes
    if (currentHash === storedHash) {
      if (global.verbose) {
        global.log('Git hash unchanged - skipping regeneration', 'verbose');
      }
      return false;
    }

    // Check if changes are trivial
    if (this.areCommitsConnected(storedHash, currentHash) && 
        this.isDiffTrivial(storedHash, currentHash)) {
      if (global.verbose) {
        global.log('Changes are trivial - skipping regeneration', 'verbose');
      }
      return false;
    }

    if (global.verbose) {
      global.log('Significant changes detected - will regenerate', 'verbose');
    }
    return true;
  }

  getBranchName() {
    if (!this.isGitRepo) return null;
    
    try {
      return execSync('git branch --show-current', {
        cwd: this.targetDir,
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
    } catch {
      return null;
    }
  }

  getRemoteUrl() {
    if (!this.isGitRepo) return null;
    
    try {
      return execSync('git config --get remote.origin.url', {
        cwd: this.targetDir,
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
    } catch {
      return null;
    }
  }

  getLastCommit() {
    if (!this.isGitRepo) return null;
    
    try {
      const log = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', {
        cwd: this.targetDir,
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();
      
      return log;
    } catch {
      return null;
    }
  }

  getGitInfo() {
    if (!this.isGitRepo) return null;
    
    return {
      branch: this.getBranchName(),
      remoteUrl: this.getRemoteUrl(),
      lastCommit: this.getLastCommit(),
      currentHash: this.getCurrentHash()
    };
  }
}

module.exports = { GitIntegration, DIFF_THRESHOLD };