#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const IGNORED_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  '*.log',
  '.DS_Store',
  'tmp',
  'temp',
  '.env',
  '.env.local',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml'
];

class GsumMcpServer {
  constructor() {
    this.server = new Server(
      {
        name: 'gsum-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'summarize_directory',
            description: 'Analyze a directory and create a comprehensive technical specification document',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the directory to analyze (defaults to current directory)',
                  default: '.'
                },
                outputFile: {
                  type: 'string',
                  description: 'Output file name for the summary',
                  default: 'DIRECTORY_SUMMARY.md'
                },
                maxDepth: {
                  type: 'number',
                  description: 'Maximum depth to traverse directories',
                  default: 10
                }
              },
              required: []
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'summarize_directory') {
        return await this.summarizeDirectory(request.params.arguments || {});
      }
      
      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async summarizeDirectory(args) {
    const targetPath = path.resolve(args.path || '.');
    const outputFile = args.outputFile || 'DIRECTORY_SUMMARY.md';
    const maxDepth = args.maxDepth || 10;

    try {
      // Collect project information
      const projectInfo = await this.analyzeProject(targetPath, maxDepth);
      
      // Generate the comprehensive summary
      const summary = this.generateSummary(projectInfo);
      
      // Write to output file
      const outputPath = path.join(targetPath, outputFile);
      await fs.writeFile(outputPath, summary, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created ${outputFile} with comprehensive project analysis.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  async analyzeProject(projectPath, maxDepth) {
    const info = {
      path: projectPath,
      name: path.basename(projectPath),
      structure: await this.getDirectoryStructure(projectPath, 0, maxDepth),
      files: [],
      gitInfo: await this.getGitInfo(projectPath),
      packageInfo: await this.getPackageInfo(projectPath),
      readmeContent: await this.getReadmeContent(projectPath),
      techStack: new Set(),
      keyPatterns: []
    };

    // Analyze all files
    await this.analyzeFiles(projectPath, info, 0, maxDepth);
    
    // Detect technology stack
    info.techStack = Array.from(info.techStack);
    
    return info;
  }

  async getDirectoryStructure(dirPath, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return {};
    
    const structure = {};
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.shouldIgnore(entry.name)) continue;
        
        if (entry.isDirectory()) {
          structure[entry.name] = await this.getDirectoryStructure(
            path.join(dirPath, entry.name),
            currentDepth + 1,
            maxDepth
          );
        } else {
          structure[entry.name] = 'file';
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
    
    return structure;
  }

  async analyzeFiles(dirPath, info, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return;
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (this.shouldIgnore(entry.name)) continue;
        
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.analyzeFiles(fullPath, info, currentDepth + 1, maxDepth);
        } else {
          const fileInfo = await this.analyzeFile(fullPath, info.path);
          if (fileInfo) {
            info.files.push(fileInfo);
            
            // Detect technology from file extensions and content
            this.detectTechnology(fileInfo, info.techStack);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  async analyzeFile(filePath, projectPath) {
    const ext = path.extname(filePath).toLowerCase();
    const relativePath = path.relative(projectPath, filePath);
    
    // Skip binary and large files
    if (this.isBinaryFile(ext)) return null;
    
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 1024 * 1024) return null; // Skip files > 1MB
      
      const content = await fs.readFile(filePath, 'utf8');
      
      return {
        path: relativePath,
        ext: ext,
        size: stats.size,
        content: content.substring(0, 1000), // First 1000 chars for analysis
        imports: this.extractImports(content, ext),
        exports: this.extractExports(content, ext),
        classes: this.extractClasses(content, ext),
        functions: this.extractFunctions(content, ext)
      };
    } catch (error) {
      return null;
    }
  }

  detectTechnology(fileInfo, techStack) {
    const { path: filePath, ext, content, imports } = fileInfo;
    
    // Detect by file extension
    const extMap = {
      '.js': 'JavaScript',
      '.jsx': 'React',
      '.ts': 'TypeScript',
      '.tsx': 'React + TypeScript',
      '.py': 'Python',
      '.go': 'Go',
      '.rs': 'Rust',
      '.java': 'Java',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.vue': 'Vue.js',
      '.svelte': 'Svelte'
    };
    
    if (extMap[ext]) {
      techStack.add(extMap[ext]);
    }
    
    // Detect by imports
    if (imports && imports.length > 0) {
      imports.forEach(imp => {
        if (imp.includes('react')) techStack.add('React');
        if (imp.includes('vue')) techStack.add('Vue.js');
        if (imp.includes('angular')) techStack.add('Angular');
        if (imp.includes('express')) techStack.add('Express.js');
        if (imp.includes('fastify')) techStack.add('Fastify');
        if (imp.includes('next')) techStack.add('Next.js');
        if (imp.includes('svelte')) techStack.add('Svelte');
        if (imp.includes('django')) techStack.add('Django');
        if (imp.includes('flask')) techStack.add('Flask');
        if (imp.includes('fastapi')) techStack.add('FastAPI');
      });
    }
    
    // Detect by file names
    if (filePath.includes('docker')) techStack.add('Docker');
    if (filePath.includes('kubernetes') || filePath.includes('k8s')) techStack.add('Kubernetes');
    if (filePath.includes('terraform')) techStack.add('Terraform');
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
    } else if (ext === '.py') {
      // Python imports
      const pyRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
      let match;
      while ((match = pyRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }
    
    return imports;
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

  extractClasses(content, ext) {
    const classes = [];
    
    if (['.js', '.jsx', '.ts', '.tsx', '.java', '.cs', '.cpp', '.py'].includes(ext)) {
      const classRegex = /class\s+(\w+)/g;
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        classes.push(match[1]);
      }
    }
    
    return classes;
  }

  extractFunctions(content, ext) {
    const functions = [];
    
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      // Function declarations and arrow functions
      const funcRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])*=>)/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        functions.push(match[1] || match[2]);
      }
    } else if (ext === '.py') {
      const defRegex = /def\s+(\w+)\s*\(/g;
      let match;
      while ((match = defRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }
    }
    
    return functions;
  }

  async getGitInfo(projectPath) {
    try {
      const isGit = await fs.access(path.join(projectPath, '.git')).then(() => true).catch(() => false);
      if (!isGit) return null;
      
      const branch = execSync('git branch --show-current', { cwd: projectPath }).toString().trim();
      const remoteUrl = execSync('git remote get-url origin', { cwd: projectPath }).toString().trim().catch(() => '');
      const lastCommit = execSync('git log -1 --format="%H %s"', { cwd: projectPath }).toString().trim();
      
      return { branch, remoteUrl, lastCommit };
    } catch (error) {
      return null;
    }
  }

  async getPackageInfo(projectPath) {
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const content = await fs.readFile(packagePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async getReadmeContent(projectPath) {
    const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'README', 'readme'];
    
    for (const filename of readmeFiles) {
      try {
        const content = await fs.readFile(path.join(projectPath, filename), 'utf8');
        return content;
      } catch (error) {
        // Continue to next filename
      }
    }
    
    return null;
  }

  shouldIgnore(name) {
    return IGNORED_PATTERNS.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(name);
      }
      return name === pattern;
    });
  }

  isBinaryFile(ext) {
    const binaryExts = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.ttf', '.otf', '.woff', '.woff2',
      '.db', '.sqlite'
    ];
    
    return binaryExts.includes(ext.toLowerCase());
  }

  generateSummary(info) {
    const timestamp = new Date().toISOString();
    let summary = `# Directory Summary Report

Generated on: ${timestamp}
Path: ${info.path}

## PROJECT OVERVIEW

`;

    // Add README content if available
    if (info.readmeContent) {
      const firstParagraph = info.readmeContent.split('\n\n')[0];
      summary += `${firstParagraph}\n\n`;
    } else if (info.packageInfo && info.packageInfo.description) {
      summary += `${info.packageInfo.description}\n\n`;
    }

    // Add package.json info
    if (info.packageInfo) {
      summary += `- **Project Name**: ${info.packageInfo.name || info.name}\n`;
      summary += `- **Version**: ${info.packageInfo.version || 'N/A'}\n`;
      if (info.packageInfo.author) {
        summary += `- **Author**: ${info.packageInfo.author}\n`;
      }
      if (info.packageInfo.license) {
        summary += `- **License**: ${info.packageInfo.license}\n`;
      }
    }

    // Git info
    if (info.gitInfo) {
      summary += `\n### Version Control\n`;
      summary += `- **Current Branch**: ${info.gitInfo.branch}\n`;
      if (info.gitInfo.remoteUrl) {
        summary += `- **Remote Repository**: ${info.gitInfo.remoteUrl}\n`;
      }
    }

    // Technology stack
    if (info.techStack.length > 0) {
      summary += `\n### Technology Stack\n`;
      info.techStack.forEach(tech => {
        summary += `- ${tech}\n`;
      });
    }

    // Setup instructions
    summary += `\n## SETUP & GETTING STARTED\n\n`;
    
    if (info.packageInfo && info.packageInfo.scripts) {
      summary += `### Available Scripts\n\n`;
      Object.entries(info.packageInfo.scripts).forEach(([name, command]) => {
        summary += `- \`npm run ${name}\`: ${command}\n`;
      });
      summary += '\n';
    }

    // Project structure
    summary += `## PROJECT STRUCTURE\n\n\`\`\`\n`;
    summary += this.formatDirectoryTree(info.structure, info.name);
    summary += `\`\`\`\n\n`;

    // Architecture overview
    summary += `## ARCHITECTURE OVERVIEW\n\n`;
    summary += this.generateArchitectureOverview(info);

    // Key modules
    summary += `## KEY MODULES & COMPONENTS\n\n`;
    summary += this.generateModulesOverview(info);

    // Dependencies
    if (info.packageInfo && (info.packageInfo.dependencies || info.packageInfo.devDependencies)) {
      summary += `## DEPENDENCIES\n\n`;
      
      if (info.packageInfo.dependencies) {
        summary += `### Production Dependencies\n\n`;
        Object.entries(info.packageInfo.dependencies).forEach(([name, version]) => {
          summary += `- **${name}**: ${version}\n`;
        });
        summary += '\n';
      }
      
      if (info.packageInfo.devDependencies) {
        summary += `### Development Dependencies\n\n`;
        Object.entries(info.packageInfo.devDependencies).forEach(([name, version]) => {
          summary += `- **${name}**: ${version}\n`;
        });
      }
    }

    return summary;
  }

  formatDirectoryTree(structure, name, prefix = '', isLast = true) {
    let tree = prefix + (isLast ? '└── ' : '├── ') + name + '/\n';
    
    const entries = Object.entries(structure);
    entries.forEach(([key, value], index) => {
      const isLastEntry = index === entries.length - 1;
      const extension = isLast ? '    ' : '│   ';
      
      if (value === 'file') {
        tree += prefix + extension + (isLastEntry ? '└── ' : '├── ') + key + '\n';
      } else {
        tree += this.formatDirectoryTree(value, key, prefix + extension, isLastEntry);
      }
    });
    
    return tree;
  }

  generateArchitectureOverview(info) {
    let overview = '';
    
    // Analyze file structure patterns
    const hasComponents = info.files.some(f => f.path.includes('components/'));
    const hasPages = info.files.some(f => f.path.includes('pages/') || f.path.includes('app/'));
    const hasApi = info.files.some(f => f.path.includes('api/') || f.path.includes('routes/'));
    const hasTests = info.files.some(f => f.path.includes('test') || f.path.includes('spec'));
    
    if (hasComponents && hasPages) {
      overview += `This appears to be a modern web application with a component-based architecture.\n\n`;
    }
    
    if (info.techStack.includes('React') || info.techStack.includes('Vue.js') || info.techStack.includes('Angular')) {
      overview += `### Frontend Architecture\n`;
      overview += `The frontend is built with ${info.techStack.find(t => ['React', 'Vue.js', 'Angular'].includes(t))}`;
      if (info.techStack.includes('TypeScript')) {
        overview += ` and TypeScript for type safety`;
      }
      overview += `.\n\n`;
    }
    
    if (hasApi) {
      overview += `### Backend Architecture\n`;
      overview += `The application includes API endpoints for server-side functionality.\n\n`;
    }
    
    if (hasTests) {
      overview += `### Testing Strategy\n`;
      overview += `The project includes test files, indicating a commitment to code quality and reliability.\n\n`;
    }
    
    return overview;
  }

  generateModulesOverview(info) {
    let modulesOverview = '';
    
    // Group files by directory
    const moduleMap = new Map();
    
    info.files.forEach(file => {
      const dir = path.dirname(file.path);
      if (!moduleMap.has(dir)) {
        moduleMap.set(dir, []);
      }
      moduleMap.get(dir).push(file);
    });
    
    // Generate overview for each module
    Array.from(moduleMap.entries())
      .filter(([dir]) => dir !== '.' && !dir.startsWith('.'))
      .slice(0, 10) // Limit to first 10 directories
      .forEach(([dir, files]) => {
        modulesOverview += `### ${dir}\n\n`;
        
        // Summarize the module
        const jsFiles = files.filter(f => ['.js', '.jsx', '.ts', '.tsx'].includes(f.ext));
        if (jsFiles.length > 0) {
          modulesOverview += `Contains ${jsFiles.length} JavaScript/TypeScript files:\n\n`;
          
          jsFiles.slice(0, 5).forEach(file => {
            modulesOverview += `- **${path.basename(file.path)}**: `;
            
            if (file.exports.length > 0) {
              modulesOverview += `Exports ${file.exports.slice(0, 3).join(', ')}`;
              if (file.exports.length > 3) modulesOverview += '...';
            } else if (file.classes.length > 0) {
              modulesOverview += `Defines ${file.classes.slice(0, 3).join(', ')}`;
            } else if (file.functions.length > 0) {
              modulesOverview += `Contains ${file.functions.length} functions`;
            }
            
            modulesOverview += '\n';
          });
          
          if (jsFiles.length > 5) {
            modulesOverview += `- ... and ${jsFiles.length - 5} more files\n`;
          }
          
          modulesOverview += '\n';
        }
      });
    
    return modulesOverview;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('gsum MCP server running');
  }
}

// Handle command line arguments
if (process.argv.includes('--version')) {
  console.log('1.0.0');
  process.exit(0);
}

const server = new GsumMcpServer();
server.run().catch(console.error);