const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function generateFallbackPrompt(projectInfo) {
  const sections = [];

  // Header
  sections.push(`# Claude Code Fallback Prompt for ${projectInfo.name}`);
  sections.push('\nPlease analyze this codebase and create a comprehensive ARCHITECTURE.gsum.md file.\n');

  // Project Overview
  sections.push('## Project Overview');
  sections.push(`- Name: ${projectInfo.name}`);
  sections.push(`- Path: ${projectInfo.path}`);
  sections.push(`- Tech Stack: ${projectInfo.techStack.join(', ')}`);
  sections.push(`- Architecture: ${projectInfo.architecture}`);
  sections.push(`- Total Files: ${projectInfo.fileCount}`);
  
  if (projectInfo.packageInfo) {
    sections.push(`\n### Package Information`);
    sections.push(`- Name: ${projectInfo.packageInfo.name}`);
    sections.push(`- Version: ${projectInfo.packageInfo.version}`);
    sections.push(`- Description: ${projectInfo.packageInfo.description || 'N/A'}`);
  }

  if (projectInfo.gitInfo) {
    sections.push(`\n### Git Information`);
    sections.push(`- Branch: ${projectInfo.gitInfo.branch}`);
    sections.push(`- Last Commit: ${projectInfo.gitInfo.lastCommit}`);
  }

  // Directory Structure
  sections.push('\n## Directory Structure');
  sections.push('```');
  sections.push(await getDirectoryTree(projectInfo.path));
  sections.push('```');

  // Key Files
  sections.push('\n## Key Files');
  
  // Read important files
  const keyFiles = await getKeyFiles(projectInfo.path);
  for (const [filePath, content] of keyFiles) {
    sections.push(`\n### ${filePath}`);
    sections.push('```');
    sections.push(content);
    sections.push('```');
  }

  // Sample Source Files
  sections.push('\n## Sample Source Files');
  const sampleFiles = await getSampleSourceFiles(projectInfo);
  for (const [filePath, content] of sampleFiles) {
    const ext = path.extname(filePath).slice(1) || 'text';
    sections.push(`\n### ${filePath}`);
    sections.push(`\`\`\`${ext}`);
    sections.push(content);
    sections.push('```');
  }

  // Task Instructions
  sections.push('\n## Your Task');
  sections.push(getTaskInstructions());

  return sections.join('\n');
}

async function getDirectoryTree(dirPath) {
  try {
    // Try using tree command first
    const tree = execSync(`tree -L 3 -I 'node_modules|.git|dist|build|coverage' "${dirPath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return tree;
  } catch {
    // Fallback to find command
    try {
      const find = execSync(
        `find "${dirPath}" -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | head -100`,
        { encoding: 'utf8' }
      );
      return find;
    } catch {
      return 'Unable to generate directory tree';
    }
  }
}

async function getKeyFiles(dirPath) {
  const keyFiles = new Map();
  const filesToCheck = [
    'README.md',
    'readme.md',
    'README.MD',
    'package.json',
    'composer.json',
    'Cargo.toml',
    'go.mod',
    'requirements.txt',
    'Gemfile',
    'pom.xml',
    'build.gradle',
    '.env.example',
    'docker-compose.yml',
    'Dockerfile',
    'Makefile',
    '.gitignore'
  ];

  for (const fileName of filesToCheck) {
    const filePath = path.join(dirPath, fileName);
    try {
      const content = await fs.readFile(filePath, 'utf8');
      keyFiles.set(fileName, content.slice(0, 1000)); // First 1000 chars
    } catch {
      // File doesn't exist, skip
    }
  }

  return keyFiles;
}

async function getSampleSourceFiles(projectInfo) {
  const sampleFiles = new Map();
  const maxSamples = 5;
  let count = 0;

  // Get a sample of files from imports/exports
  const filesWithImports = Object.keys(projectInfo.imports || {});
  const filesWithExports = Object.keys(projectInfo.exports || {});
  const interestingFiles = [...new Set([...filesWithImports, ...filesWithExports])];

  for (const filePath of interestingFiles) {
    if (count >= maxSamples) break;
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(projectInfo.path, filePath);
      sampleFiles.set(relativePath, content.slice(0, 2000)); // First 2000 chars
      count++;
    } catch {
      // Skip files that can't be read
    }
  }

  return sampleFiles;
}

function getTaskInstructions() {
  return `Create a comprehensive ARCHITECTURE & TECHNICAL SPECIFICATION document that includes:

1. **PROJECT OVERVIEW** - What this project does, its purpose, and value
2. **SETUP & GETTING STARTED** - How to install and run the project
3. **ARCHITECTURE OVERVIEW** - High-level design decisions and patterns
4. **PROJECT STRUCTURE** - Detailed directory and file organization
5. **KEY MODULES & COMPONENTS** - Core functionality breakdown
6. **DATABASE & DATA MODELS** - Schema and data relationships (if applicable)
7. **API DESIGN** - Endpoints and communication patterns (if applicable)
8. **FRONTEND ARCHITECTURE** - UI components and state management (if applicable)
9. **BUSINESS LOGIC** - Core algorithms and rules
10. **TESTING STRATEGY** - How tests are organized and run
11. **DEPLOYMENT & CONFIGURATION** - How to deploy and configure
12. **DEVELOPMENT WORKFLOW** - Git workflow and contribution guidelines
13. **SECURITY CONSIDERATIONS** - Security measures and concerns
14. **PERFORMANCE OPTIMIZATIONS** - Performance strategies
15. **IMPORTANT PATTERNS & CONVENTIONS** - Coding standards
16. **CURRENT LIMITATIONS & TECH DEBT** - Known issues
17. **INTEGRATION POINTS** - External services and APIs
18. **ADDING NEW FEATURES** - Guide for developers

Make this document EXTREMELY detailed (10,000+ words) with code examples.`;
}

module.exports = { generateFallbackPrompt };