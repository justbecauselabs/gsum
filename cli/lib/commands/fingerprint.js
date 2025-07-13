const { ProjectAnalyzer } = require('../analyzer');
const { GitIntegration } = require('../git');

async function runFingerprint(options) {
  const path = require('path');
  const targetDir = options.path ? path.resolve(options.path) : process.cwd();
  
  if (global.verbose) {
    global.log(`Generating fingerprint for ${targetDir}`, 'verbose');
  }

  const analyzer = new ProjectAnalyzer(options);
  const projectInfo = await analyzer.analyze(targetDir);
  
  // Build fingerprint
  const fingerprint = {
    name: projectInfo.packageInfo?.name || projectInfo.name,
    tech: projectInfo.techStack.slice(0, 5).join('/'),
    architecture: projectInfo.architecture,
    structure: getStructureSummary(projectInfo),
    files: {
      total: projectInfo.fileCount,
      byType: getFileTypeBreakdown(projectInfo)
    },
    patterns: detectPatterns(projectInfo),
    dependencies: getDependencySummary(projectInfo),
    git: await getGitSummary(targetDir)
  };
  
  // Format output
  console.log('🗺️  Codebase Fingerprint\n');
  console.log(`📦 ${fingerprint.name}`);
  console.log(`🔧 Tech: ${fingerprint.tech}`);
  console.log(`🏗️  Structure: ${fingerprint.structure}`);
  console.log(`📄 Files: ${fingerprint.files.total} (${fingerprint.files.byType})`);
  console.log(`🎯 Patterns: ${fingerprint.patterns.join(', ')}`);
  console.log(`📚 Dependencies: ${fingerprint.dependencies}`);
  if (fingerprint.git) {
    console.log(`🌿 Git: ${fingerprint.git}`);
  }
  
  if (options.format === 'json') {
    console.log('\n' + JSON.stringify(fingerprint, null, 2));
  }
  
  return fingerprint;
}

function getStructureSummary(projectInfo) {
  const topLevelDirs = Object.keys(projectInfo.structure)
    .filter(key => typeof projectInfo.structure[key] === 'object' && !key.startsWith('.'))
    .slice(0, 5);
  
  if (projectInfo.packageInfo && projectInfo.packageInfo.workspaces) {
    return `Monorepo with ${projectInfo.packageInfo.workspaces.length} packages`;
  } else if (topLevelDirs.includes('packages')) {
    return 'Monorepo structure';
  } else if (topLevelDirs.includes('src')) {
    return 'Standard src layout';
  } else if (topLevelDirs.includes('lib')) {
    return 'Library structure';
  } else {
    return 'Custom structure';
  }
}

function getFileTypeBreakdown(projectInfo) {
  const extensions = {};
  
  const countFiles = (obj, ext = extensions) => {
    for (const [key, value] of Object.entries(obj)) {
      if (value === 'file') {
        const match = key.match(/\.([^.]+)$/);
        if (match) {
          const extension = match[1].toLowerCase();
          ext[extension] = (ext[extension] || 0) + 1;
        }
      } else if (typeof value === 'object' && !value._skipped) {
        countFiles(value, ext);
      }
    }
  };
  
  countFiles(projectInfo.structure);
  
  // Get top 3 extensions
  const sorted = Object.entries(extensions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return sorted.map(([ext, count]) => `.${ext}: ${count}`).join(', ');
}

function detectPatterns(projectInfo) {
  const patterns = [];
  
  // State management
  if (projectInfo.techStack.includes('Redux')) {
    patterns.push('Redux state');
  } else if (projectInfo.techStack.includes('MobX')) {
    patterns.push('MobX state');
  } else if (projectInfo.techStack.includes('Zustand')) {
    patterns.push('Zustand state');
  }
  
  // API patterns
  if (projectInfo.structure.graphql || projectInfo.techStack.includes('GraphQL')) {
    patterns.push('GraphQL API');
  } else if (projectInfo.structure.api || projectInfo.structure.routes) {
    patterns.push('REST API');
  }
  
  // Testing
  if (projectInfo.structure.test || projectInfo.structure.tests || projectInfo.structure.__tests__) {
    patterns.push('Unit tests');
  }
  if (projectInfo.structure.e2e) {
    patterns.push('E2E tests');
  }
  
  // Architecture patterns
  if (projectInfo.structure.controllers && projectInfo.structure.models) {
    patterns.push('MVC');
  }
  if (projectInfo.structure.components) {
    patterns.push('Component-based');
  }
  
  return patterns.length > 0 ? patterns : ['Standard patterns'];
}

function getDependencySummary(projectInfo) {
  if (!projectInfo.packageInfo) {
    return 'No package.json';
  }
  
  const deps = Object.keys(projectInfo.packageInfo.dependencies || {}).length;
  const devDeps = Object.keys(projectInfo.packageInfo.devDependencies || {}).length;
  
  return `${deps} prod, ${devDeps} dev`;
}

async function getGitSummary(targetDir) {
  const git = new GitIntegration(targetDir);
  
  try {
    const branch = git.getCurrentBranch();
    const commitCount = parseInt(
      git.execGit('rev-list --count HEAD').trim()
    );
    const contributors = git.execGit('shortlog -sn --no-merges')
      .split('\n')
      .filter(line => line.trim())
      .length;
    
    return `${branch} branch, ${commitCount} commits, ${contributors} contributors`;
  } catch (error) {
    return null;
  }
}

module.exports = { runFingerprint };