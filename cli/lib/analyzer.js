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
    this.maxDepth = options.depth || 10;
    this.includePatterns = options.include ? options.include.split(',') : null;
    this.excludePatterns = options.exclude ? options.exclude.split(',') : IGNORED_PATTERNS;
    this.useGit = options.git !== false;
    this.verbose = global.verbose || false;
    this.debug = global.debug || false;
    this.focusArea = options.focus || null;
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

    // Detect architecture patterns
    projectInfo.architecture = this.detectArchitecture(projectInfo);

    // Convert Sets to arrays for serialization
    projectInfo.techStack = Array.from(projectInfo.techStack);
    projectInfo.imports = Object.fromEntries(projectInfo.imports);
    projectInfo.exports = Object.fromEntries(projectInfo.exports);

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
}

module.exports = { ProjectAnalyzer };