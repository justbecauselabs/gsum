const path = require('path');

// Token optimization constants
const MAX_TOKENS = {
  ephemeral: 3000,
  save: 4000,
  plan: 2500
};

// Priority patterns for Claude context
const PRIORITY_PATTERNS = {
  // High priority - core implementation files
  high: [
    'main', 'index', 'app', 'server',
    'routes', 'api', 'handler', 'controller',
    'model', 'schema', 'service', 'core'
  ],
  // Medium priority - configuration and setup
  medium: [
    'config', 'setup', 'init', 'middleware',
    'auth', 'database', 'utils', 'helpers'
  ],
  // Low priority - tests, docs, assets
  low: [
    'test', 'spec', 'mock', 'fixture',
    'readme', 'doc', 'example', 'demo'
  ]
};

// File pattern importance scores
const FILE_SCORES = {
  entryPoints: 10,      // main.js, index.js, app.js
  apiRoutes: 9,         // API endpoints and routes
  businessLogic: 8,     // Core services and models
  configuration: 7,     // Config files
  utilities: 6,         // Helper functions
  types: 5,            // Type definitions
  tests: 3,            // Test files
  documentation: 2,     // Docs and examples
  assets: 1            // Static assets
};

class ClaudeOptimizer {
  constructor(options = {}) {
    this.verbose = global.verbose || false;
    this.debug = global.debug || false;
    this.maxTokens = options.maxTokens || MAX_TOKENS.ephemeral;
  }

  optimizeForClaude(projectInfo, options = {}) {
    const mode = options.mode || 'ephemeral';
    const task = options.task || null;
    
    if (this.verbose) {
      global.log(`Optimizing for Claude (mode: ${mode}, task: ${task || 'general'})`, 'verbose');
    }

    // Build optimized context based on mode
    let optimizedContent;
    switch (mode) {
      case 'ephemeral':
        optimizedContent = this.buildEphemeralContext(projectInfo, options);
        break;
      case 'save':
        optimizedContent = this.buildComprehensiveContext(projectInfo, options);
        break;
      case 'plan':
        optimizedContent = this.buildPlanContext(projectInfo, task, options);
        break;
      default:
        optimizedContent = this.buildEphemeralContext(projectInfo, options);
    }

    return optimizedContent;
  }

  buildEphemeralContext(projectInfo, options = {}) {
    const sections = [];
    
    // Architecture header
    sections.push(this.formatArchitectureHeader(projectInfo));
    
    // Key files section with line numbers
    const keyFiles = this.selectKeyFiles(projectInfo, options.smartFiles || 10);
    sections.push(this.formatKeyFiles(keyFiles, projectInfo));
    
    // Common patterns
    sections.push(this.formatCommonPatterns(projectInfo));
    
    // Quick reference for adding features
    sections.push(this.formatQuickReference(projectInfo));
    
    // Include smart file contents if available
    if (projectInfo.smartFiles && projectInfo.smartFiles.contents) {
      sections.push(this.formatSmartFileContents(projectInfo.smartFiles));
    }
    
    return sections.join('\n\n');
  }

  buildComprehensiveContext(projectInfo, options = {}) {
    const sections = [];
    
    // Full architecture documentation
    sections.push(this.formatFullArchitecture(projectInfo));
    
    // Detailed file listing with importance scores
    sections.push(this.formatDetailedFiles(projectInfo));
    
    // Implementation patterns
    sections.push(this.formatImplementationPatterns(projectInfo));
    
    // Directory structure guide
    sections.push(this.formatDirectoryGuide(projectInfo));
    
    // Dependencies and setup
    sections.push(this.formatDependencies(projectInfo));
    
    return sections.join('\n\n');
  }

  buildPlanContext(projectInfo, task, options = {}) {
    const sections = [];
    
    // Task-specific header
    sections.push(`## IMPLEMENTATION PLAN: ${task}\n`);
    
    // Most relevant files for the task
    const relevantFiles = this.selectTaskRelevantFiles(projectInfo, task, options.smartFiles || 10);
    sections.push(this.formatTaskFiles(relevantFiles, projectInfo));
    
    // Step-by-step implementation
    sections.push(this.formatImplementationSteps(projectInfo, task));
    
    // Code patterns from similar features
    sections.push(this.formatSimilarPatterns(projectInfo, task));
    
    return sections.join('\n\n');
  }

  formatArchitectureHeader(projectInfo) {
    const techStack = projectInfo.techStack.join('/');
    const architecture = projectInfo.architecture || 'Application';
    
    return `## ARCHITECTURE: ${techStack} ${architecture}`;
  }

  formatKeyFiles(files, projectInfo) {
    const lines = ['## KEY FILES FOR DEVELOPMENT'];
    
    for (const file of files.slice(0, 10)) {
      const relPath = path.relative(projectInfo.path, file.path);
      const lineInfo = this.getLineInfo(file);
      const description = this.getFileDescription(file, projectInfo);
      
      lines.push(`- \`${relPath}${lineInfo}\` - ${description}`);
    }
    
    return lines.join('\n');
  }

  formatCommonPatterns(projectInfo) {
    const lines = ['## COMMON PATTERNS'];
    
    // Detect patterns from imports/exports
    const patterns = this.detectPatterns(projectInfo);
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern) {
        lines.push(`- ${category}: ${pattern}`);
      }
    }
    
    return lines.join('\n');
  }

  formatQuickReference(projectInfo) {
    const lines = ['## TO ADD NEW FEATURE'];
    
    // Generate feature addition steps based on architecture
    const steps = this.generateFeatureSteps(projectInfo);
    
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    
    return lines.join('\n');
  }

  formatSmartFileContents(smartFiles) {
    const lines = ['## SELECTED FILE CONTENTS'];
    
    for (const file of smartFiles.selected) {
      const content = smartFiles.contents[file.path];
      if (content) {
        lines.push(`\n### ${file.path}`);
        lines.push('```' + this.getFileLanguage(file.path));
        
        // Include key functions with line numbers
        const keyParts = this.extractKeyParts(content);
        lines.push(keyParts);
        
        lines.push('```');
      }
    }
    
    return lines.join('\n');
  }

  selectKeyFiles(projectInfo, limit = 10) {
    const files = [];
    
    // Score all files
    for (const [filePath, imports] of Object.entries(projectInfo.imports || {})) {
      const score = this.scoreFile(filePath, imports, projectInfo);
      files.push({ path: filePath, score, imports });
    }
    
    // Sort by score and return top files
    files.sort((a, b) => b.score - a.score);
    return files.slice(0, limit);
  }

  scoreFile(filePath, imports, projectInfo) {
    let score = 0;
    const basename = path.basename(filePath).toLowerCase();
    const dirPath = path.dirname(filePath);
    
    // Entry point bonus
    if (basename.match(/^(index|main|app|server)\.(js|ts|jsx|tsx)$/)) {
      score += FILE_SCORES.entryPoints;
    }
    
    // API routes bonus
    if (dirPath.includes('api') || dirPath.includes('routes') || basename.includes('route')) {
      score += FILE_SCORES.apiRoutes;
    }
    
    // Business logic bonus
    if (dirPath.includes('service') || dirPath.includes('model') || basename.includes('service')) {
      score += FILE_SCORES.businessLogic;
    }
    
    // Import count bonus (more imports = more central)
    score += Math.min(imports.length * 0.5, 5);
    
    // Penalize test files
    if (basename.includes('test') || basename.includes('spec')) {
      score -= FILE_SCORES.tests;
    }
    
    return score;
  }

  detectPatterns(projectInfo) {
    const patterns = {
      Components: null,
      API: null,
      State: null,
      Routing: null,
      Styling: null
    };
    
    // Analyze imports to detect patterns
    const allImports = Object.values(projectInfo.imports || {}).flat();
    
    // React patterns
    if (allImports.some(imp => imp.includes('react'))) {
      patterns.Components = 'React components in `src/components/`';
      
      if (allImports.some(imp => imp.includes('hook'))) {
        patterns.Components += ', custom hooks in `src/hooks/`';
      }
    }
    
    // State management
    if (allImports.some(imp => imp.includes('redux'))) {
      patterns.State = 'Redux store in `src/store/`';
    } else if (allImports.some(imp => imp.includes('zustand'))) {
      patterns.State = 'Zustand stores in `src/stores/`';
    } else if (allImports.some(imp => imp.includes('mobx'))) {
      patterns.State = 'MobX stores';
    }
    
    // API patterns
    if (allImports.some(imp => imp.includes('axios'))) {
      patterns.API = 'Axios client in `src/api/`';
    } else if (allImports.some(imp => imp.includes('fetch'))) {
      patterns.API = 'Fetch API wrapper';
    }
    
    // Routing
    if (allImports.some(imp => imp.includes('react-router'))) {
      patterns.Routing = 'React Router in `src/routes/`';
    } else if (allImports.some(imp => imp.includes('next'))) {
      patterns.Routing = 'Next.js file-based routing';
    }
    
    return patterns;
  }

  generateFeatureSteps(projectInfo) {
    const steps = [];
    const techStack = projectInfo.techStack;
    
    // React/Frontend steps
    if (techStack.some(tech => tech.includes('React'))) {
      steps.push('Create component in `src/components/`');
      steps.push('Add API call to `src/api/` if needed');
      steps.push('Update state management');
      steps.push('Add route if new page');
    }
    
    // Backend steps
    else if (techStack.includes('Express.js')) {
      steps.push('Create route handler in `routes/`');
      steps.push('Add controller logic in `controllers/`');
      steps.push('Update model if data changes');
      steps.push('Add validation middleware');
    }
    
    // Generic steps
    else {
      steps.push('Identify entry point for feature');
      steps.push('Create necessary files following existing patterns');
      steps.push('Update configuration if needed');
      steps.push('Add tests for new functionality');
    }
    
    return steps;
  }

  getLineInfo(file) {
    // In real implementation, would analyze file for key function locations
    // For now, return empty or estimated lines
    if (file.exports && file.exports.length > 0) {
      return ':10-50'; // Placeholder line numbers
    }
    return '';
  }

  getFileDescription(file, projectInfo) {
    const basename = path.basename(file.path);
    const dirName = path.basename(path.dirname(file.path));
    
    // Try to infer description from file name and location
    if (basename.includes('route')) {
      return 'API routes';
    } else if (basename.includes('controller')) {
      return 'Request handlers';
    } else if (basename.includes('model')) {
      return 'Data models';
    } else if (basename.includes('service')) {
      return 'Business logic';
    } else if (dirName === 'components') {
      return 'UI component';
    } else if (basename.includes('config')) {
      return 'Configuration';
    } else if (file.exports && file.exports.length > 0) {
      return `Exports: ${file.exports.slice(0, 3).join(', ')}`;
    }
    
    return 'Implementation file';
  }

  extractKeyParts(content) {
    // Extract main functions and classes
    const lines = content.split('\n');
    const keyParts = [];
    let inKeyPart = false;
    let currentPart = [];
    let lineNum = 1;
    
    for (const line of lines) {
      // Detect function/class declarations
      if (line.match(/^(export\s+)?(function|class|const|let|var)\s+\w+/)) {
        if (currentPart.length > 0) {
          keyParts.push(currentPart.join('\n'));
          currentPart = [];
        }
        inKeyPart = true;
        currentPart.push(`// Line ${lineNum}`);
      }
      
      if (inKeyPart) {
        currentPart.push(line);
        
        // Simple heuristic: stop after 10 lines or at next function
        if (currentPart.length > 10 || (currentPart.length > 2 && line.match(/^(export\s+)?(function|class|const|let|var)\s+\w+/))) {
          keyParts.push(currentPart.slice(0, -1).join('\n'));
          currentPart = [line];
        }
      }
      
      lineNum++;
    }
    
    if (currentPart.length > 0) {
      keyParts.push(currentPart.join('\n'));
    }
    
    // Return first few key parts
    return keyParts.slice(0, 3).join('\n\n');
  }

  getFileLanguage(filePath) {
    const ext = path.extname(filePath);
    const langMap = {
      '.js': 'javascript',
      '.jsx': 'jsx',
      '.ts': 'typescript',
      '.tsx': 'tsx',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.rb': 'ruby',
      '.php': 'php'
    };
    return langMap[ext] || '';
  }

  selectTaskRelevantFiles(projectInfo, task, limit = 10) {
    // Score files based on task keywords
    const taskKeywords = this.extractTaskKeywords(task);
    const files = [];
    
    for (const [filePath, imports] of Object.entries(projectInfo.imports || {})) {
      const score = this.scoreFileForTask(filePath, imports, taskKeywords, projectInfo);
      files.push({ path: filePath, score, imports });
    }
    
    files.sort((a, b) => b.score - a.score);
    return files.slice(0, limit);
  }

  extractTaskKeywords(task) {
    const keywords = task.toLowerCase().split(/\s+/);
    
    // Add related keywords
    const expansions = {
      'auth': ['authentication', 'login', 'user', 'session', 'token'],
      'api': ['endpoint', 'route', 'controller', 'rest', 'graphql'],
      'database': ['model', 'schema', 'query', 'migration'],
      'ui': ['component', 'view', 'page', 'layout', 'style'],
      'test': ['spec', 'mock', 'fixture', 'assert', 'expect']
    };
    
    const expanded = [...keywords];
    for (const keyword of keywords) {
      if (expansions[keyword]) {
        expanded.push(...expansions[keyword]);
      }
    }
    
    return [...new Set(expanded)];
  }

  scoreFileForTask(filePath, imports, keywords, projectInfo) {
    let score = this.scoreFile(filePath, imports, projectInfo);
    
    // Boost score for keyword matches
    const lowerPath = filePath.toLowerCase();
    for (const keyword of keywords) {
      if (lowerPath.includes(keyword)) {
        score += 5;
      }
    }
    
    return score;
  }

  formatTaskFiles(files, projectInfo) {
    const lines = ['## RELEVANT FILES FOR THIS TASK'];
    
    for (const file of files.slice(0, 10)) {
      const relPath = path.relative(projectInfo.path, file.path);
      const description = this.getTaskFileDescription(file, projectInfo);
      
      lines.push(`- \`${relPath}\` - ${description}`);
    }
    
    return lines.join('\n');
  }

  formatImplementationSteps(projectInfo, task) {
    const lines = ['## IMPLEMENTATION STEPS'];
    
    // Generate task-specific steps
    const steps = this.generateTaskSteps(projectInfo, task);
    
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    
    return lines.join('\n');
  }

  generateTaskSteps(projectInfo, task) {
    const taskLower = task.toLowerCase();
    const steps = [];
    
    // Auth-related tasks
    if (taskLower.includes('auth') || taskLower.includes('login')) {
      steps.push('Create auth middleware in `middleware/auth.js`');
      steps.push('Add user model/schema if not exists');
      steps.push('Create auth routes (login, logout, register)');
      steps.push('Implement JWT token generation/validation');
      steps.push('Add auth state management (frontend)');
    }
    // API tasks
    else if (taskLower.includes('api') || taskLower.includes('endpoint')) {
      steps.push('Define route in appropriate router file');
      steps.push('Create controller method for business logic');
      steps.push('Add input validation middleware');
      steps.push('Update API documentation');
      steps.push('Write integration tests');
    }
    // Generic feature tasks
    else {
      steps.push('Identify files that need modification');
      steps.push('Create new files following project structure');
      steps.push('Implement core functionality');
      steps.push('Add error handling');
      steps.push('Write tests for new code');
    }
    
    return steps;
  }

  formatSimilarPatterns(projectInfo, task) {
    const lines = ['## PATTERNS FROM SIMILAR FEATURES'];
    
    // Find similar existing features
    const patterns = this.findSimilarPatterns(projectInfo, task);
    
    for (const pattern of patterns.slice(0, 3)) {
      lines.push(`\n### Pattern: ${pattern.name}`);
      lines.push(`Location: \`${pattern.file}\``);
      lines.push('```' + this.getFileLanguage(pattern.file));
      lines.push(pattern.code);
      lines.push('```');
    }
    
    return lines.join('\n');
  }

  findSimilarPatterns(projectInfo, task) {
    // In a real implementation, would analyze existing code
    // For now, return placeholder patterns
    return [
      {
        name: 'Existing route handler pattern',
        file: 'src/routes/example.js',
        code: `router.post('/example', authenticate, async (req, res) => {
  try {
    const result = await service.process(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`
      }
    ];
  }

  getTaskFileDescription(file, projectInfo) {
    // Enhanced description for task context
    const desc = this.getFileDescription(file, projectInfo);
    
    if (file.imports && file.imports.length > 0) {
      const relevantImports = file.imports.slice(0, 3).join(', ');
      return `${desc} (uses: ${relevantImports})`;
    }
    
    return desc;
  }

  // Comprehensive context methods
  formatFullArchitecture(projectInfo) {
    const lines = ['# PROJECT ARCHITECTURE'];
    
    lines.push(`\n## Overview`);
    lines.push(`- **Name**: ${projectInfo.name}`);
    lines.push(`- **Type**: ${projectInfo.architecture}`);
    lines.push(`- **Tech Stack**: ${projectInfo.techStack.join(', ')}`);
    lines.push(`- **Files**: ${projectInfo.fileCount}`);
    
    return lines.join('\n');
  }

  formatDetailedFiles(projectInfo) {
    const lines = ['## FILE ORGANIZATION'];
    
    // Group files by category
    const categories = this.categorizeFiles(projectInfo);
    
    for (const [category, files] of Object.entries(categories)) {
      if (files.length > 0) {
        lines.push(`\n### ${category}`);
        for (const file of files.slice(0, 5)) {
          lines.push(`- \`${file.path}\` - ${file.description}`);
        }
      }
    }
    
    return lines.join('\n');
  }

  categorizeFiles(projectInfo) {
    const categories = {
      'Entry Points': [],
      'API/Routes': [],
      'Business Logic': [],
      'Data Models': [],
      'Configuration': [],
      'Utilities': [],
      'Tests': []
    };
    
    // Categorize each file
    for (const filePath of Object.keys(projectInfo.imports || {})) {
      const category = this.getFileCategory(filePath);
      const relPath = path.relative(projectInfo.path, filePath);
      
      if (categories[category]) {
        categories[category].push({
          path: relPath,
          description: this.getFileDescription({ path: filePath }, projectInfo)
        });
      }
    }
    
    return categories;
  }

  getFileCategory(filePath) {
    const basename = path.basename(filePath).toLowerCase();
    const dirPath = path.dirname(filePath).toLowerCase();
    
    if (basename.match(/^(index|main|app|server)/)) {
      return 'Entry Points';
    } else if (dirPath.includes('route') || dirPath.includes('api')) {
      return 'API/Routes';
    } else if (dirPath.includes('service') || dirPath.includes('controller')) {
      return 'Business Logic';
    } else if (dirPath.includes('model') || dirPath.includes('schema')) {
      return 'Data Models';
    } else if (basename.includes('config')) {
      return 'Configuration';
    } else if (dirPath.includes('util') || dirPath.includes('helper')) {
      return 'Utilities';
    } else if (basename.includes('test') || basename.includes('spec')) {
      return 'Tests';
    }
    
    return 'Other';
  }

  formatImplementationPatterns(projectInfo) {
    const lines = ['## IMPLEMENTATION PATTERNS'];
    
    const patterns = this.detectPatterns(projectInfo);
    
    for (const [area, pattern] of Object.entries(patterns)) {
      if (pattern) {
        lines.push(`\n### ${area}`);
        lines.push(pattern);
      }
    }
    
    return lines.join('\n');
  }

  formatDirectoryGuide(projectInfo) {
    const lines = ['## DIRECTORY STRUCTURE'];
    
    lines.push('```');
    lines.push(this.formatTree(projectInfo.structure, '', 2));
    lines.push('```');
    
    return lines.join('\n');
  }

  formatTree(structure, prefix = '', maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) return '';
    
    const entries = Object.entries(structure);
    const lines = [];
    
    entries.forEach(([name, value], index) => {
      const isLast = index === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      
      if (value === 'file') {
        lines.push(prefix + connector + name);
      } else if (value._truncated || value._skipped) {
        lines.push(prefix + connector + name + '/ ...');
      } else if (typeof value === 'object') {
        lines.push(prefix + connector + name + '/');
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        lines.push(this.formatTree(value, newPrefix, maxDepth, currentDepth + 1));
      }
    });
    
    return lines.filter(Boolean).join('\n');
  }

  formatDependencies(projectInfo) {
    const lines = ['## DEPENDENCIES'];
    
    if (projectInfo.packageInfo) {
      lines.push('\n### Production Dependencies');
      const deps = projectInfo.packageInfo.dependencies.slice(0, 10);
      lines.push(deps.map(d => `- ${d}`).join('\n'));
      
      if (projectInfo.packageInfo.dependencies.length > 10) {
        lines.push(`- ... and ${projectInfo.packageInfo.dependencies.length - 10} more`);
      }
    }
    
    return lines.join('\n');
  }
}

module.exports = { ClaudeOptimizer, MAX_TOKENS, PRIORITY_PATTERNS };