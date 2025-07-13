const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SmartFileSelector {
  constructor(options = {}) {
    this.maxFiles = options.smartFiles || 10;
    this.projectPath = options.projectPath || process.cwd();
    this.verbose = global.verbose || false;
  }

  async selectFiles(projectInfo) {
    const scores = new Map();
    
    // Get recent git changes if available
    const recentChanges = await this.getRecentGitChanges();
    
    // Analyze all files
    const allFiles = await this.getAllFiles(projectInfo);
    
    for (const file of allFiles) {
      let score = 0;
      
      // 1. Recent git activity (highest weight)
      if (recentChanges.has(file)) {
        score += recentChanges.get(file) * 50;
      }
      
      // 2. Import frequency (files imported by many others)
      const importCount = this.getImportCount(file, projectInfo);
      score += importCount * 10;
      
      // 3. File complexity (size + structure)
      const complexity = await this.calculateComplexity(file);
      score += complexity * 5;
      
      // 4. Centrality (files in key directories)
      const centrality = this.calculateCentrality(file);
      score += centrality * 8;
      
      // 5. File type importance
      const typeScore = this.getFileTypeScore(file);
      score += typeScore * 7;
      
      scores.set(file, score);
    }
    
    // Sort by score and take top N
    const sortedFiles = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxFiles)
      .map(([file]) => file);
    
    if (this.verbose) {
      global.log(`Selected ${sortedFiles.length} most relevant files`, 'verbose');
      sortedFiles.forEach((file, i) => {
        global.log(`  ${i + 1}. ${file} (score: ${scores.get(file).toFixed(2)})`, 'verbose');
      });
    }
    
    return sortedFiles;
  }

  async getRecentGitChanges() {
    const changes = new Map();
    
    try {
      // Get changed files in last 30 commits
      const gitLog = execSync(
        'git log --name-only --pretty=format: -30 2>/dev/null || true',
        { cwd: this.projectPath, encoding: 'utf8' }
      );
      
      const files = gitLog.split('\n').filter(f => f.trim());
      
      // Count changes per file
      for (const file of files) {
        if (file) {
          changes.set(file, (changes.get(file) || 0) + 1);
        }
      }
      
      // Normalize scores (0-1)
      const maxChanges = Math.max(...changes.values());
      for (const [file, count] of changes) {
        changes.set(file, count / maxChanges);
      }
    } catch (error) {
      // Git not available or not a git repo
      if (this.verbose) {
        global.log('Git history not available for smart file selection', 'verbose');
      }
    }
    
    return changes;
  }

  async getAllFiles(projectInfo) {
    const files = [];
    
    const traverse = (obj, currentPath = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = currentPath ? path.join(currentPath, key) : key;
        
        if (typeof value === 'object' && !value._skipped && !value._error) {
          traverse(value, fullPath);
        } else if (value === 'file') {
          files.push(fullPath);
        }
      }
    };
    
    traverse(projectInfo.structure);
    return files;
  }

  getImportCount(file, projectInfo) {
    // Count how many other files import this one
    let count = 0;
    const fileName = path.basename(file, path.extname(file));
    
    for (const [importingFile, imports] of Object.entries(projectInfo.imports)) {
      if (imports.includes(fileName) || imports.includes(`./${file}`) || imports.includes(file)) {
        count++;
      }
    }
    
    return count;
  }

  async calculateComplexity(file) {
    try {
      const fullPath = path.join(this.projectPath, file);
      const stats = await fs.stat(fullPath);
      const sizeScore = Math.min(stats.size / 10000, 1); // Normalize to 0-1
      
      // Add more complexity metrics if needed
      // - Number of functions/classes
      // - Cyclomatic complexity
      // - Depth of nesting
      
      return sizeScore;
    } catch (error) {
      return 0;
    }
  }

  calculateCentrality(file) {
    const keyDirectories = [
      'src', 'lib', 'core', 'app', 'components', 'api', 
      'services', 'utils', 'models', 'controllers'
    ];
    
    const parts = file.split(path.sep);
    let score = 0;
    
    // Files in key directories get higher scores
    for (const dir of keyDirectories) {
      if (parts.includes(dir)) {
        score += 0.5;
      }
    }
    
    // Root-level config files are important
    if (parts.length === 1 && file.match(/\.(json|js|ts|yml|yaml)$/)) {
      score += 0.8;
    }
    
    // Entry points are very important
    if (file.match(/(index|main|app)\.(js|ts|jsx|tsx)$/)) {
      score += 1;
    }
    
    return Math.min(score, 1);
  }

  getFileTypeScore(file) {
    const ext = path.extname(file).toLowerCase();
    const name = path.basename(file).toLowerCase();
    
    // Configuration files
    if (name.match(/^(package|tsconfig|webpack|vite|rollup|babel)/)) {
      return 0.9;
    }
    
    // Main entry points
    if (name.match(/^(index|main|app)/)) {
      return 0.8;
    }
    
    // Source files
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.java'].includes(ext)) {
      return 0.6;
    }
    
    // Config files
    if (['.json', '.yml', '.yaml', '.toml'].includes(ext)) {
      return 0.5;
    }
    
    // Documentation
    if (['.md', '.mdx'].includes(ext)) {
      return 0.3;
    }
    
    return 0.1;
  }

  async getFileContents(files) {
    const contents = [];
    
    for (const file of files) {
      try {
        const fullPath = path.join(this.projectPath, file);
        const content = await fs.readFile(fullPath, 'utf8');
        const lines = content.split('\n');
        
        // Include first 50 lines or whole file if smaller
        const preview = lines.slice(0, 50).join('\n');
        const truncated = lines.length > 50;
        
        contents.push({
          path: file,
          content: preview,
          truncated,
          totalLines: lines.length
        });
      } catch (error) {
        if (this.verbose) {
          global.log(`Could not read ${file}: ${error.message}`, 'verbose');
        }
      }
    }
    
    return contents;
  }
}

module.exports = { SmartFileSelector };