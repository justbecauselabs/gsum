const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { GitIntegration } = require('./git');

// Cache directory structure
const CACHE_DIR = '.gsum';
const CACHE_FILES = {
  context: 'context.md',
  contextBase: 'context-base.md',
  fileRankings: 'file-rankings.json',
  metadata: 'cache-metadata.json',
  analyzerCache: 'analyzer-cache.json'
};

// Change impact thresholds
const IMPACT_THRESHOLDS = {
  MICRO: { files: 1, lines: 50 },
  PARTIAL: { files: 5, lines: 200 },
  FULL: { files: 10, lines: 500 }
};

class CacheManager {
  constructor(targetDir) {
    this.targetDir = targetDir;
    this.cacheDir = path.join(targetDir, CACHE_DIR);
    this.git = new GitIntegration(targetDir);
    this.verbose = global.verbose || false;
    this.debug = global.debug || false;
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      // Create subdirectories
      await fs.mkdir(path.join(this.cacheDir, 'context-diffs'), { recursive: true });
      await fs.mkdir(path.join(this.cacheDir, 'file-summaries'), { recursive: true });
    } catch (error) {
      if (this.debug) {
        global.log(`Error creating cache directory: ${error.message}`, 'debug');
      }
    }
  }

  async getCachePath(filename) {
    await this.ensureCacheDir();
    return path.join(this.cacheDir, filename);
  }

  async readCache(filename) {
    try {
      const filePath = await this.getCachePath(filename);
      const content = await fs.readFile(filePath, 'utf8');
      
      if (filename.endsWith('.json')) {
        return JSON.parse(content);
      }
      return content;
    } catch (error) {
      if (this.debug) {
        global.log(`Cache miss for ${filename}: ${error.message}`, 'debug');
      }
      return null;
    }
  }

  async writeCache(filename, data) {
    try {
      const filePath = await this.getCachePath(filename);
      const content = filename.endsWith('.json') 
        ? JSON.stringify(data, null, 2)
        : data;
      
      await fs.writeFile(filePath, content, 'utf8');
      
      if (this.verbose) {
        global.log(`Cache written: ${filename}`, 'verbose');
      }
    } catch (error) {
      if (this.debug) {
        global.log(`Error writing cache ${filename}: ${error.message}`, 'debug');
      }
    }
  }

  async getMetadata() {
    const metadata = await this.readCache(CACHE_FILES.metadata) || {
      version: '0.1.0',
      created: new Date().toISOString(),
      lastUpdate: new Date().toISOString(),
      lastFullAnalysis: null,
      lastGitHash: null,
      changesSinceBaseline: [],
      updateHistory: []
    };
    return metadata;
  }

  async updateMetadata(updates) {
    const metadata = await this.getMetadata();
    Object.assign(metadata, updates, {
      lastUpdate: new Date().toISOString()
    });
    await this.writeCache(CACHE_FILES.metadata, metadata);
    return metadata;
  }

  async shouldRegenerate(options = {}) {
    // Force regeneration if requested
    if (options.force) {
      if (this.verbose) {
        global.log('Force flag set, will regenerate cache', 'verbose');
      }
      return { regenerate: true, type: 'full' };
    }

    // Check if cache exists
    const contextExists = await this.cacheExists(CACHE_FILES.context);
    if (!contextExists) {
      if (this.verbose) {
        global.log('No cache exists, will generate', 'verbose');
      }
      return { regenerate: true, type: 'full' };
    }

    // Check metadata
    const metadata = await this.getMetadata();
    const currentHash = this.git.getCurrentHash();

    if (!metadata.lastGitHash) {
      return { regenerate: true, type: 'full' };
    }

    if (currentHash === metadata.lastGitHash) {
      if (this.verbose) {
        global.log('Git hash unchanged, using cache', 'verbose');
      }
      return { regenerate: false };
    }

    // Analyze changes
    const changeImpact = await this.analyzeChangeImpact(metadata.lastGitHash, currentHash);
    
    if (this.verbose) {
      global.log(`Change impact: ${JSON.stringify(changeImpact)}`, 'verbose');
    }

    return this.determineUpdateStrategy(changeImpact);
  }

  async analyzeChangeImpact(oldHash, newHash) {
    if (!this.git.isGitRepo) {
      return { fileCount: 0, totalLines: 0, hasApiChanges: false };
    }

    try {
      // Get list of changed files
      const changedFiles = execSync(
        `git diff --name-only ${oldHash}..${newHash}`,
        { cwd: this.targetDir, encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);

      // Get line changes per file
      const diffStats = execSync(
        `git diff --numstat ${oldHash}..${newHash}`,
        { cwd: this.targetDir, encoding: 'utf8' }
      ).trim().split('\n').filter(Boolean);

      let totalLines = 0;
      let maxLinesInOneFile = 0;
      const fileChanges = [];

      for (const stat of diffStats) {
        const [added, deleted, filepath] = stat.split('\t');
        const lines = parseInt(added) + parseInt(deleted);
        totalLines += lines;
        maxLinesInOneFile = Math.max(maxLinesInOneFile, lines);
        
        fileChanges.push({
          path: filepath,
          lines,
          added: parseInt(added),
          deleted: parseInt(deleted)
        });
      }

      // Analyze change patterns
      const impact = {
        fileCount: changedFiles.length,
        totalLines,
        hasApiChanges: changedFiles.some(f => f.includes('/api/') || f.includes('/routes/')),
        hasDepChanges: changedFiles.includes('package.json') || changedFiles.includes('requirements.txt'),
        hasConfigChanges: changedFiles.some(f => this.isConfigFile(f)),
        hasMultipleModules: this.countAffectedModules(changedFiles) > 2,
        maxLinesInOneFile,
        files: fileChanges
      };

      return impact;
    } catch (error) {
      if (this.debug) {
        global.log(`Error analyzing changes: ${error.message}`, 'debug');
      }
      return { fileCount: 0, totalLines: 0, hasApiChanges: false };
    }
  }

  determineUpdateStrategy(impact) {
    if (this.shouldFullRegenerate(impact)) {
      return { regenerate: true, type: 'full', impact };
    } else if (this.shouldPartialUpdate(impact)) {
      return { regenerate: true, type: 'partial', impact };
    } else {
      return { regenerate: true, type: 'micro', impact };
    }
  }

  shouldFullRegenerate(impact) {
    return (
      // Multi-file changes with significant lines
      (impact.fileCount > IMPACT_THRESHOLDS.FULL.files && impact.totalLines > IMPACT_THRESHOLDS.FULL.lines) ||
      // API contract changes
      (impact.hasApiChanges && impact.fileCount > 2) ||
      // Dependency changes
      impact.hasDepChanges ||
      // Cross-module refactoring
      (impact.hasMultipleModules && impact.totalLines > 100) ||
      // Major single-file rewrite
      impact.maxLinesInOneFile > 1000
    );
  }

  shouldPartialUpdate(impact) {
    return (
      // Multiple files but focused changes
      (impact.fileCount > 1 && impact.fileCount <= IMPACT_THRESHOLDS.PARTIAL.files) ||
      // Single large file change
      (impact.fileCount === 1 && impact.maxLinesInOneFile > IMPACT_THRESHOLDS.PARTIAL.lines) ||
      // Config changes that affect architecture
      impact.hasConfigChanges
    );
  }

  isConfigFile(filepath) {
    const configPatterns = [
      'config', '.config', 'conf',
      'webpack', 'vite', 'rollup', 'babel',
      'tsconfig', 'jsconfig', '.eslintrc', '.prettierrc',
      'docker', 'k8s', 'kubernetes',
      '.env', 'settings'
    ];
    
    const lowerPath = filepath.toLowerCase();
    return configPatterns.some(pattern => lowerPath.includes(pattern));
  }

  countAffectedModules(files) {
    const modules = new Set();
    
    for (const file of files) {
      const parts = file.split('/');
      if (parts.length > 1) {
        // Consider top-level directory as module
        modules.add(parts[0]);
      }
    }
    
    return modules.size;
  }

  async saveIncrementalChange(changeData) {
    const hash = changeData.currentHash || this.git.getCurrentHash();
    const filename = `${hash.substring(0, 8)}.json`;
    const diffPath = path.join(this.cacheDir, 'context-diffs', filename);
    
    await fs.writeFile(diffPath, JSON.stringify(changeData, null, 2));
    
    // Update accumulated changes
    await this.updateAccumulatedChanges(changeData);
  }

  async updateAccumulatedChanges(changeData) {
    const accPath = path.join(this.cacheDir, 'context-diffs', 'accumulated.json');
    
    let accumulated = {};
    try {
      const content = await fs.readFile(accPath, 'utf8');
      accumulated = JSON.parse(content);
    } catch {
      accumulated = {
        files: {},
        totalChanges: 0,
        since: changeData.timestamp
      };
    }
    
    // Merge changes
    for (const file of changeData.files || []) {
      if (!accumulated.files[file.path]) {
        accumulated.files[file.path] = {
          added: 0,
          deleted: 0,
          changes: []
        };
      }
      
      accumulated.files[file.path].added += file.added || 0;
      accumulated.files[file.path].deleted += file.deleted || 0;
      accumulated.files[file.path].changes.push({
        hash: changeData.currentHash,
        timestamp: changeData.timestamp,
        lines: file.lines
      });
    }
    
    accumulated.totalChanges++;
    accumulated.lastUpdate = changeData.timestamp;
    
    await fs.writeFile(accPath, JSON.stringify(accumulated, null, 2));
  }

  async cacheFileAnalysis(filePath, analysis) {
    const fileHash = await this.getFileHash(filePath);
    const cacheKey = `${fileHash}.json`;
    const cachePath = path.join(this.cacheDir, 'file-summaries', cacheKey);
    
    const cacheData = {
      path: filePath,
      hash: fileHash,
      timestamp: new Date().toISOString(),
      analysis
    };
    
    await fs.writeFile(cachePath, JSON.stringify(cacheData, null, 2));
  }

  async getCachedFileAnalysis(filePath) {
    try {
      const fileHash = await this.getFileHash(filePath);
      const cacheKey = `${fileHash}.json`;
      const cachePath = path.join(this.cacheDir, 'file-summaries', cacheKey);
      
      const content = await fs.readFile(cachePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    } catch {
      return null;
    }
  }

  async updateFileRankings(rankings) {
    await this.writeCache(CACHE_FILES.fileRankings, rankings);
  }

  async getFileRankings() {
    return await this.readCache(CACHE_FILES.fileRankings) || {};
  }

  async cacheExists(filename) {
    try {
      const filePath = await this.getCachePath(filename);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async clearCache() {
    try {
      const files = await fs.readdir(this.cacheDir);
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
          // Clear subdirectory contents
          const subFiles = await fs.readdir(filePath);
          for (const subFile of subFiles) {
            await fs.unlink(path.join(filePath, subFile));
          }
        } else {
          await fs.unlink(filePath);
        }
      }
      
      if (this.verbose) {
        global.log('Cache cleared', 'verbose');
      }
    } catch (error) {
      if (this.debug) {
        global.log(`Error clearing cache: ${error.message}`, 'debug');
      }
    }
  }

  async getContextWithFallback(options = {}) {
    // Try to get cached context first
    const cached = await this.readCache(CACHE_FILES.context);
    if (cached && !options.fresh) {
      const metadata = await this.getMetadata();
      
      // Check if cache is recent (within last hour)
      const cacheAge = Date.now() - new Date(metadata.lastUpdate).getTime();
      const oneHour = 60 * 60 * 1000;
      
      if (cacheAge < oneHour || options.allowStale) {
        if (this.verbose) {
          global.log('Using cached context', 'verbose');
        }
        return { content: cached, fromCache: true };
      }
    }
    
    return null;
  }

  async saveContext(context, options = {}) {
    await this.writeCache(CACHE_FILES.context, context);
    
    // Save as baseline if it's a full regeneration
    if (options.isBaseline) {
      await this.writeCache(CACHE_FILES.contextBase, context);
    }
    
    // Update metadata
    const currentHash = this.git.getCurrentHash();
    await this.updateMetadata({
      lastGitHash: currentHash,
      lastFullAnalysis: options.isBaseline ? new Date().toISOString() : undefined
    });
  }
}

module.exports = { CacheManager, IMPACT_THRESHOLDS };