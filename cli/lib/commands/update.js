const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

async function runUpdate(options) {
  const branch = options.branch || 'main';
  
  console.log('🔄 Updating gsum to the latest version...\n');
  
  try {
    // Find the gsum installation directory
    const gsumPath = await findGsumInstallation();
    
    if (!gsumPath) {
      throw new Error('Could not find gsum installation directory');
    }
    
    if (global.verbose) {
      global.log(`Found gsum at: ${gsumPath}`, 'verbose');
    }
    
    // Check if it's a git repository
    const isGitRepo = await checkIfGitRepo(gsumPath);
    
    if (!isGitRepo) {
      console.log('⚠️  gsum installation is not a git repository.');
      console.log('Please reinstall gsum using the installation script.\n');
      return;
    }
    
    // Fetch latest changes
    console.log('📡 Fetching latest changes...');
    execSync(`git fetch origin ${branch}`, {
      cwd: gsumPath,
      stdio: 'inherit'
    });
    
    // Check for updates
    const hasUpdates = checkForUpdates(gsumPath, branch);
    
    if (!hasUpdates) {
      console.log('✅ gsum is already up to date!\n');
      return;
    }
    
    // Pull latest changes
    console.log('📥 Pulling latest changes...');
    execSync(`git pull origin ${branch}`, {
      cwd: gsumPath,
      stdio: 'inherit'
    });
    
    // Rebuild
    console.log('\n🔨 Rebuilding gsum...');
    
    // Install npm dependencies for CLI
    console.log('📦 Installing dependencies...');
    execSync('npm install', {
      cwd: path.join(gsumPath, 'cli'),
      stdio: 'inherit'
    });
    
    // Run make install
    console.log('\n🚀 Running installation...');
    execSync('make install', {
      cwd: gsumPath,
      stdio: 'inherit'
    });
    
    console.log('\n✅ gsum has been successfully updated!\n');
    
    // Show version
    const version = require('../package.json').version;
    console.log(`Current version: ${version}`);
    
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    
    if (global.debug) {
      console.error(error.stack);
    }
    
    console.log('\nTo manually update, run:');
    console.log('  cd <gsum-directory>');
    console.log('  git pull origin main');
    console.log('  make install\n');
    
    process.exit(1);
  }
}

async function findGsumInstallation() {
  // Check if we're running from the development directory
  const currentDir = path.resolve(__dirname, '../../..');
  const gitDir = path.join(currentDir, '.git');
  
  try {
    await fs.access(gitDir);
    return currentDir;
  } catch {
    // Not in development directory
  }
  
  // Check common installation locations
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const possiblePaths = [
    path.join(homeDir, 'gsum'),
    path.join(homeDir, '.gsum'),
    path.join(homeDir, 'src', 'gsum'),
    path.join(homeDir, 'projects', 'gsum'),
    '/opt/gsum',
    '/usr/local/gsum'
  ];
  
  for (const gsumPath of possiblePaths) {
    try {
      const gitDir = path.join(gsumPath, '.git');
      await fs.access(gitDir);
      return gsumPath;
    } catch {
      // Not found here
    }
  }
  
  return null;
}

async function checkIfGitRepo(dirPath) {
  try {
    const gitDir = path.join(dirPath, '.git');
    const stats = await fs.stat(gitDir);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function checkForUpdates(dirPath, branch) {
  try {
    const localCommit = execSync('git rev-parse HEAD', {
      cwd: dirPath,
      encoding: 'utf8'
    }).trim();
    
    const remoteCommit = execSync(`git rev-parse origin/${branch}`, {
      cwd: dirPath,
      encoding: 'utf8'
    }).trim();
    
    return localCommit !== remoteCommit;
  } catch {
    return true; // Assume updates are available on error
  }
}

module.exports = { runUpdate };