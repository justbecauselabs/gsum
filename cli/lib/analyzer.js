const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const micromatch = require('micromatch');

// File cache for performance
const fileCache = new Map();

// Common ignored patterns
const IGNORED_PATTERNS = [
  'node_modules/**',
  'vendor/**',
  'bower_components/**',
  '.git/**',
  'dist/**',
  'build/**',
  'out/**',
  '.next/**',
  '__pycache__/**',
  'venv/**',
  '.venv/**',
  '*.pyc',
  '.DS_Store',
  'coverage/**',
  '.nyc_output/**',
  '*.log',
  '*.lock',
  'yarn.lock',
  'package-lock.json',
  'composer.lock',
  'Gemfile.lock',
  '.idea/**',
  '.vscode/**',
  '*.min.js',
  '*.min.css',
  '*.map',
  '.cache/**',
  'tmp/**',
  'temp/**',
  '.env*',
  '*.sqlite',
  '*.db'
];

// Binary file extensions to skip
const BINARY_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.webp',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv',
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.sqlite', '.db', '.dat'
];

// Deep directories that are typically not worth traversing deeply
const DEEP_DIRECTORIES = [
  'node_modules', 'vendor', 'bower_components', '.git',
  'dist', 'build', 'out', '.next', '__pycache__',
  'venv', '.venv', 'coverage', '.nyc_output'
];

// Focus area patterns
const FOCUS_PATTERNS = {
  frontend: {
    include: ['components', 'pages', 'views', 'layouts', 'ui', 'client', 'src/components', 'src/pages', 'app'],
    extensions: ['.jsx', '.tsx', '.vue', '.svelte', '.css', '.scss', '.less', '.styled.js'],
    keywords: ['component', 'view', 'page', 'layout', 'ui', 'style', 'theme']
  },
  api: {
    include: ['api', 'routes', 'controllers', 'middleware', 'server', 'endpoints', 'handlers', 'services'],
    extensions: ['.js', '.ts', '.py', '.go', '.java', '.rb'],
    keywords: ['route', 'controller', 'endpoint', 'handler', 'middleware', 'api', 'rest', 'graphql']
  },
  database: {
    include: ['models', 'schemas', 'migrations', 'db', 'database', 'entities', 'repositories'],
    extensions: ['.sql', '.prisma', '.js', '.ts', '.py'],
    keywords: ['model', 'schema', 'migration', 'entity', 'repository', 'database', 'table', 'query']
  },
  authentication: {
    include: ['auth', 'authentication', 'login', 'user', 'users', 'session', 'jwt', 'oauth', 'middleware'],
    extensions: ['.js', '.ts', '.py', '.go', '.java', '.rb'],
    keywords: ['auth', 'login', 'register', 'signin', 'signup', 'jwt', 'token', 'session', 'oauth', 'passport', 'user', 'permission', 'role', 'authorize', 'authenticate']
  },
  security: {
    include: ['security', 'auth', 'validation', 'sanitization', 'middleware', 'guards', 'rbac'],
    extensions: ['.js', '.ts', '.py', '.go', '.java', '.rb'],
    keywords: ['security', 'validate', 'sanitize', 'encrypt', 'decrypt', 'hash', 'csrf', 'xss', 'cors', 'permission', 'rbac', 'acl', 'guard', 'policy']
  },
  performance: {
    include: ['cache', 'optimization', 'performance', 'monitoring', 'metrics', 'profiling'],
    extensions: ['.js', '.ts', '.py', '.go', '.java', '.rb'],
    keywords: ['cache', 'optimize', 'performance', 'benchmark', 'profiling', 'metrics', 'monitoring', 'lazy', 'memoize', 'throttle', 'debounce']
  },
  configuration: {
    include: ['config', 'configuration', 'settings', 'env', 'environment'],
    extensions: ['.json', '.yml', '.yaml', '.env', '.config.js', '.config.ts', '.toml', '.ini'],
    keywords: ['config', 'configuration', 'settings', 'environment', 'env', 'variable', 'constant', 'parameter']
  },
  logging: {
    include: ['logs', 'logging', 'logger', 'monitoring', 'observability'],
    extensions: ['.js', '.ts', '.py', '.go', '.java', '.rb'],
    keywords: ['log', 'logger', 'logging', 'trace', 'debug', 'info', 'warn', 'error', 'monitor', 'observability']
  },
  infrastructure: {
    include: ['infrastructure', 'terraform', 'cloudformation', 'pulumi', 'ansible', 'k8s', 'kubernetes', 'helm'],
    extensions: ['.tf', '.tfvars', '.yml', '.yaml', '.json', '.hcl'],
    keywords: ['infrastructure', 'terraform', 'cloudformation', 'pulumi', 'provision', 'resource', 'deployment', 'cluster']
  },
  testing: {
    include: ['test', 'tests', '__tests__', 'spec', 'e2e', 'integration', 'unit'],
    extensions: ['.test.js', '.spec.js', '.test.ts', '.spec.ts', '.test.jsx', '.test.tsx', '_test.go', '_test.py'],
    keywords: ['test', 'spec', 'describe', 'it', 'expect', 'assert', 'mock', 'stub']
  },
  deployment: {
    include: ['deploy', 'deployment', '.github/workflows', 'ci', 'cd', 'docker', 'k8s', 'kubernetes', 'terraform', 'ansible'],
    extensions: ['.yml', '.yaml', 'Dockerfile', '.dockerignore', '.tf', '.tfvars', 'Jenkinsfile'],
    keywords: ['deploy', 'build', 'pipeline', 'workflow', 'container', 'orchestration', 'infrastructure']
  },
  tooling: {
    include: ['scripts', 'tools', 'bin', 'utils', 'build', 'webpack', 'vite', 'rollup', 'babel', 'eslint', 'prettier'],
    extensions: ['.config.js', '.config.ts', 'webpack.config.js', 'vite.config.js', '.eslintrc', '.prettierrc', 'Makefile'],
    keywords: ['config', 'build', 'bundle', 'lint', 'format', 'compile', 'transpile', 'script']
  },
  documentation: {
    include: ['docs', 'documentation', 'wiki', 'guides', 'tutorials', 'examples'],
    extensions: ['.md', '.mdx', '.rst', '.txt', '.adoc'],
    keywords: ['readme', 'guide', 'tutorial', 'example', 'documentation', 'usage', 'api-docs']
  }
};

class ProjectAnalyzer {
  constructor(options = {}) {
    this.maxDepth = options.depth || 5;
    this.includePatterns = options.include ? options.include.split(',') : null;
    this.excludePatterns = options.exclude ? options.exclude.split(',') : IGNORED_PATTERNS;
    this.useGit = options.git !== false;
    this.verbose = global.verbose || false;
    this.debug = global.debug || false;
    this.focusArea = options.focus || null;
    // Import graph tracking
    this.importGraph = new Map(); // file -> Set of imported files
    this.exportGraph = new Map(); // file -> Set of files that import it
    this.fileCentrality = new Map(); // file -> centrality score
  }

  async analyze(dirPath) {
    const startTime = Date.now();
    
    if (this.verbose) {
      global.log(`Analyzing directory: ${dirPath}`, 'verbose');
    }

    const projectInfo = {
      path: dirPath,
      name: path.basename(dirPath),
      structure: {},
      techStack: new Set(),
      fileCount: 0,
      totalSize: 0,
      imports: new Map(),
      exports: new Map(),
      gitInfo: null,
      packageInfo: null,
      architecture: null
    };

    // Analyze git info if available
    if (this.useGit) {
      projectInfo.gitInfo = await this.getGitInfo(dirPath);
    }

    // Check for package.json
    projectInfo.packageInfo = await this.getPackageInfo(dirPath);

    // Get directory structure
    projectInfo.structure = await this.getDirectoryStructure(dirPath, 0);

    // Analyze files
    await this.analyzeFiles(dirPath, projectInfo, 0);

    // Build import graph
    await this.buildImportGraph(projectInfo);
    
    // Calculate file centrality scores
    this.calculateFileCentrality();

    // Detect architecture patterns
    projectInfo.architecture = this.detectArchitecture(projectInfo);

    // Convert Sets to arrays for serialization
    projectInfo.techStack = Array.from(projectInfo.techStack);
    projectInfo.imports = Object.fromEntries(projectInfo.imports);
    projectInfo.exports = Object.fromEntries(projectInfo.exports);
    
    // Add graph data to project info
    projectInfo.importGraph = Object.fromEntries(
      Array.from(this.importGraph.entries()).map(([k, v]) => [k, Array.from(v)])
    );
    projectInfo.fileCentrality = Object.fromEntries(this.fileCentrality);

    const elapsed = Date.now() - startTime;
    if (this.verbose) {
      global.log(`Analysis completed in ${elapsed}ms`, 'verbose');
      global.log(`Files analyzed: ${projectInfo.fileCount}`, 'verbose');
      global.log(`Tech stack: ${projectInfo.techStack.join(', ')}`, 'verbose');
    }

    return projectInfo;
  }

  async getDirectoryStructure(dirPath, currentDepth) {
    if (currentDepth >= this.maxDepth) {
      return { _truncated: true };
    }

    const structure = {};
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.shouldIgnore(entry.name, path.join(dirPath, entry.name))) {
          continue;
        }

        if (entry.isDirectory()) {
          // Skip deep directories at lower depths
          if (DEEP_DIRECTORIES.includes(entry.name) && currentDepth > 1) {
            structure[entry.name] = { _skipped: true };
          } else {
            structure[entry.name] = await this.getDirectoryStructure(
              path.join(dirPath, entry.name),
              currentDepth + 1
            );
          }
        } else {
          structure[entry.name] = 'file';
        }
      }
    } catch (error) {
      if (this.debug) {
        global.log(`Error reading directory ${dirPath}: ${error.message}`, 'debug');
      }
      return { _error: error.message };
    }

    return structure;
  }

  async analyzeFiles(dirPath, projectInfo, currentDepth) {
    if (currentDepth >= this.maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const BATCH_SIZE = 10;

      // Process files in batches
      const files = entries
        .filter(entry => entry.isFile() && !this.shouldIgnore(entry.name, path.join(dirPath, entry.name)))
        .map(entry => path.join(dirPath, entry.name));

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(filePath => this.analyzeFile(filePath, projectInfo)));
      }

      // Process subdirectories
      const directories = entries
        .filter(entry => entry.isDirectory() && !this.shouldIgnore(entry.name, path.join(dirPath, entry.name)));

      for (const dir of directories) {
        if (!DEEP_DIRECTORIES.includes(dir.name) || currentDepth < 2) {
          await this.analyzeFiles(path.join(dirPath, dir.name), projectInfo, currentDepth + 1);
        }
      }
    } catch (error) {
      if (this.debug) {
        global.log(`Error analyzing files in ${dirPath}: ${error.message}`, 'debug');
      }
    }
  }

  async analyzeFile(filePath, projectInfo) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Skip binary files
    if (BINARY_EXTENSIONS.includes(ext)) return;

    try {
      // Check cache
      const cached = this.getCached(filePath);
      if (cached) {
        this.updateProjectInfo(projectInfo, cached);
        return;
      }

      const stats = await fs.stat(filePath);
      
      // Skip very large files
      if (stats.size > 1024 * 1024) return;

      projectInfo.fileCount++;
      projectInfo.totalSize += stats.size;

      // Read only first 1KB for analysis
      const content = await this.readFileStart(filePath, 1024);
      
      const fileInfo = {
        path: filePath,
        ext,
        size: stats.size,
        mtime: stats.mtimeMs,
        imports: [],
        exports: []
      };

      // Detect technology
      this.detectTechnology(filePath, content, ext, projectInfo.techStack);

      // Extract imports/exports
      if (this.isSourceFile(ext)) {
        fileInfo.imports = this.extractImports(content, ext);
        fileInfo.exports = this.extractExports(content, ext);
        
        // Update project info
        if (fileInfo.imports.length > 0) {
          projectInfo.imports.set(filePath, fileInfo.imports);
        }
        if (fileInfo.exports.length > 0) {
          projectInfo.exports.set(filePath, fileInfo.exports);
        }
      }

      // Cache the result
      this.setCache(filePath, fileInfo);
      
    } catch (error) {
      if (this.debug) {
        global.log(`Error analyzing file ${filePath}: ${error.message}`, 'debug');
      }
    }
  }

  async readFileStart(filePath, bytes = 1024) {
    const fd = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(bytes);
    const { bytesRead } = await fd.read(buffer, 0, bytes, 0);
    await fd.close();
    return buffer.toString('utf8', 0, bytesRead);
  }

  detectTechnology(filePath, content, ext, techStack) {
    // Extension-based detection
    const extMap = {
      '.js': 'JavaScript',
      '.jsx': 'React',
      '.ts': 'TypeScript', 
      '.tsx': 'React + TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.vue': 'Vue.js',
      '.svelte': 'Svelte'
    };

    if (extMap[ext]) {
      techStack.add(extMap[ext]);
    }

    // Import-based detection
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('from react') || lowerContent.includes('import react')) {
      techStack.add('React');
    }
    if (lowerContent.includes('from vue') || lowerContent.includes('import vue')) {
      techStack.add('Vue.js');
    }
    if (lowerContent.includes('from angular') || lowerContent.includes('import @angular')) {
      techStack.add('Angular');
    }
    if (lowerContent.includes('express')) {
      techStack.add('Express.js');
    }
    if (lowerContent.includes('django')) {
      techStack.add('Django');
    }
    if (lowerContent.includes('flask')) {
      techStack.add('Flask');
    }

    // Filename-based detection
    const basename = path.basename(filePath).toLowerCase();
    if (basename.includes('docker')) {
      techStack.add('Docker');
    }
    if (basename.includes('kubernetes') || basename.includes('k8s')) {
      techStack.add('Kubernetes');
    }
    if (basename === 'cargo.toml') {
      techStack.add('Rust');
    }
    if (basename === 'go.mod') {
      techStack.add('Go');
    }
  }

  extractImports(content, ext) {
    const imports = [];
    
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      // ES6 imports
      const es6Regex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = es6Regex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // CommonJS requires
      const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = cjsRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    } else if (['.py'].includes(ext)) {
      // Python imports
      const pyRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
      let match;
      while ((match = pyRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }

    return [...new Set(imports)]; // Remove duplicates
  }

  extractExports(content, ext) {
    const exports = [];
    
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      // ES6 exports
      const exportRegex = /export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)/g;
      let match;
      while ((match = exportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
    }

    return exports;
  }

  detectArchitecture(projectInfo) {
    const techStackArray = Array.from(projectInfo.techStack);
    const hasBackend = techStackArray.some(tech => 
      ['Express.js', 'Django', 'Flask', 'Spring', 'Rails'].includes(tech)
    );
    
    const hasFrontend = techStackArray.some(tech =>
      ['React', 'Vue.js', 'Angular', 'Svelte'].includes(tech)
    );

    if (hasBackend && hasFrontend) {
      return 'Full-stack';
    } else if (hasBackend) {
      return 'Backend';
    } else if (hasFrontend) {
      return 'Frontend';
    } else if (projectInfo.techStack.has('React Native') || projectInfo.techStack.has('Flutter')) {
      return 'Mobile';
    } else {
      return 'Library/Tool';
    }
  }

  async getGitInfo(dirPath) {
    try {
      const gitPath = path.join(dirPath, '.git');
      const stats = await fs.stat(gitPath);
      
      if (stats.isDirectory()) {
        // This would normally use git commands, but for now return basic info
        return {
          isGitRepo: true,
          branch: 'main', // Would use git branch
          remote: null     // Would use git remote
        };
      }
    } catch (error) {
      // Not a git repo
    }
    return null;
  }

  async getPackageInfo(dirPath) {
    try {
      const packagePath = path.join(dirPath, 'package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      const pkg = JSON.parse(content);
      
      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {})
      };
    } catch (error) {
      // No package.json
    }
    return null;
  }

  shouldIgnore(name, fullPath) {
    // Check if included
    if (this.includePatterns) {
      const relativePath = path.relative(process.cwd(), fullPath);
      if (!micromatch.isMatch(relativePath, this.includePatterns)) {
        return true;
      }
    }

    // Check if excluded
    if (this.excludePatterns) {
      if (micromatch.isMatch(name, this.excludePatterns) || 
          micromatch.isMatch(fullPath, this.excludePatterns)) {
        return true;
      }
    }
    
    // Check focus area filtering
    if (this.focusArea && !this.matchesFocusArea(name, fullPath)) {
      return true;
    }

    return false;
  }
  
  matchesFocusArea(name, fullPath) {
    if (!this.focusArea || !FOCUS_PATTERNS[this.focusArea]) {
      return true;
    }
    
    const patterns = FOCUS_PATTERNS[this.focusArea];
    const ext = path.extname(name).toLowerCase();
    const relativePath = path.relative(process.cwd(), fullPath);
    
    // Check if file extension matches
    if (patterns.extensions && patterns.extensions.some(e => name.endsWith(e))) {
      return true;
    }
    
    // Check if path contains focus directories
    if (patterns.include) {
      for (const dir of patterns.include) {
        if (relativePath.includes(dir + path.sep) || relativePath.includes(path.sep + dir + path.sep)) {
          return true;
        }
      }
    }
    
    // Check if filename contains focus keywords
    if (patterns.keywords) {
      const lowerName = name.toLowerCase();
      if (patterns.keywords.some(keyword => lowerName.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }

  isSourceFile(ext) {
    const sourceExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go',
      '.rs', '.rb', '.php', '.swift', '.kt', '.cs', '.cpp',
      '.c', '.vue', '.svelte'
    ];
    return sourceExtensions.includes(ext);
  }

  getCached(filePath) {
    if (fileCache.has(filePath)) {
      const cached = fileCache.get(filePath);
      // In a real implementation, would check mtime
      return cached;
    }
    return null;
  }

  setCache(filePath, data) {
    fileCache.set(filePath, data);
  }

  updateProjectInfo(projectInfo, fileInfo) {
    projectInfo.fileCount++;
    projectInfo.totalSize += fileInfo.size || 0;
    
    if (fileInfo.imports && fileInfo.imports.length > 0) {
      projectInfo.imports.set(fileInfo.path, fileInfo.imports);
    }
    if (fileInfo.exports && fileInfo.exports.length > 0) {
      projectInfo.exports.set(fileInfo.path, fileInfo.exports);
    }
  }

  async buildImportGraph(projectInfo) {
    if (this.verbose) {
      global.log('Building import dependency graph...', 'verbose');
    }

    // Initialize graph nodes
    for (const [filePath, imports] of projectInfo.imports.entries()) {
      if (!this.importGraph.has(filePath)) {
        this.importGraph.set(filePath, new Set());
      }

      // Resolve imports to actual file paths
      for (const importPath of imports) {
        const resolvedPath = await this.resolveImportPath(filePath, importPath, projectInfo);
        if (resolvedPath) {
          // Add edge in import graph
          this.importGraph.get(filePath).add(resolvedPath);
          
          // Add reverse edge in export graph
          if (!this.exportGraph.has(resolvedPath)) {
            this.exportGraph.set(resolvedPath, new Set());
          }
          this.exportGraph.get(resolvedPath).add(filePath);
        }
      }
    }

    if (this.debug) {
      global.log(`Import graph built with ${this.importGraph.size} nodes`, 'debug');
    }
  }

  async resolveImportPath(fromFile, importPath, projectInfo) {
    // Skip external modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null;
    }

    const fromDir = path.dirname(fromFile);
    let resolvedPath;

    try {
      // Try direct resolution
      resolvedPath = path.resolve(fromDir, importPath);
      
      // Try common extensions if no extension provided
      if (!path.extname(resolvedPath)) {
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
        for (const ext of extensions) {
          const withExt = resolvedPath + ext;
          if (projectInfo.imports.has(withExt) || projectInfo.exports.has(withExt)) {
            return withExt;
          }
        }
        
        // Try index file
        const indexPath = path.join(resolvedPath, 'index.js');
        if (projectInfo.imports.has(indexPath) || projectInfo.exports.has(indexPath)) {
          return indexPath;
        }
      }

      // Check if resolved path exists in our project
      if (projectInfo.imports.has(resolvedPath) || projectInfo.exports.has(resolvedPath)) {
        return resolvedPath;
      }
    } catch (error) {
      if (this.debug) {
        global.log(`Failed to resolve import ${importPath} from ${fromFile}`, 'debug');
      }
    }

    return null;
  }

  calculateFileCentrality() {
    if (this.verbose) {
      global.log('Calculating file centrality scores...', 'verbose');
    }

    // Initialize all files with base score
    const allFiles = new Set([
      ...this.importGraph.keys(),
      ...this.exportGraph.keys()
    ]);

    for (const file of allFiles) {
      // Centrality based on:
      // 1. Number of files that import this file (in-degree)
      // 2. Number of files this file imports (out-degree)
      // 3. Betweenness (simplified - files that connect many others)
      
      const importedBy = this.exportGraph.get(file)?.size || 0;
      const importsCount = this.importGraph.get(file)?.size || 0;
      
      // Higher weight for being imported (indicates reusability)
      const centrality = (importedBy * 2) + importsCount;
      
      // Bonus for certain file patterns
      const basename = path.basename(file).toLowerCase();
      let bonus = 0;
      
      if (basename.match(/^(index|main|app|server)/)) {
        bonus += 5; // Entry points
      }
      if (file.includes('/utils/') || file.includes('/helpers/')) {
        bonus += 3; // Utility files tend to be central
      }
      if (file.includes('/config/') || basename.includes('config')) {
        bonus += 3; // Configuration files
      }
      
      this.fileCentrality.set(file, centrality + bonus);
    }

    // Normalize scores to 0-100 range
    const maxScore = Math.max(...this.fileCentrality.values());
    if (maxScore > 0) {
      for (const [file, score] of this.fileCentrality.entries()) {
        this.fileCentrality.set(file, Math.round((score / maxScore) * 100));
      }
    }

    if (this.verbose) {
      const topFiles = Array.from(this.fileCentrality.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      global.log('Top 5 central files:', 'verbose');
      for (const [file, score] of topFiles) {
        global.log(`  ${path.basename(file)}: ${score}`, 'verbose');
      }
    }
  }

  getFileCentralityScore(filePath) {
    return this.fileCentrality.get(filePath) || 0;
  }

  getImportedBy(filePath) {
    return Array.from(this.exportGraph.get(filePath) || []);
  }

  getImports(filePath) {
    return Array.from(this.importGraph.get(filePath) || []);
  }
}

module.exports = { ProjectAnalyzer };