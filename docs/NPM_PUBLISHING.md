# 🚀 NPM Publishing Guide for gsum

This comprehensive guide covers publishing gsum to npm, including setup, automated publishing, and maintenance.

## Overview

The gsum project is configured for **dual distribution**:

### 1. npm/npx Installation
```bash
# One-time usage
npx gsum

# Global installation
npm install -g gsum

# Project dependency
npm install --save-dev gsum
```

### 2. Git Installation (Current method)
```bash
git clone https://github.com/justbecauselabs/gsum.git
cd gsum && make install
```

## Package Structure

```
gsum/
├── package.json              # npm package metadata
├── bin/
│   └── gsum.js              # npm executable entry point
├── lib/
│   └── index.js             # npm library export
├── cli/                     # Actual CLI implementation
│   ├── gsum.js              # CLI logic
│   ├── package.json         # CLI dependencies
│   └── lib/                 # All CLI modules
├── scripts/
│   └── postinstall.js       # npm post-install (optional)
├── .npmignore               # npm package exclusions
├── CHANGELOG.md             # Version history
└── .github/workflows/
    └── npm-publish.yml      # Automated publishing
```

## Prerequisites

### One-time Setup

1. **npm Account**: Create account at https://npmjs.com
2. **npm Authentication**: 
   ```bash
   npm login
   npm whoami  # Verify you're logged in
   ```
3. **Package Name**: Verify "gsum" is available ✅
4. **GitHub Secrets**: Add `NPM_TOKEN` to repository secrets

### Generate npm Token (for CI/CD)

1. Go to https://www.npmjs.com/
2. Click your profile → Access Tokens
3. Click "Generate New Token"
4. Choose "Automation" type
5. Copy the token (starts with `npm_`)
6. Add to GitHub Secrets:
   - Go to https://github.com/justbecauselabs/gsum/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token

## Publishing Methods

### Method 1: Automated Publishing (Recommended)

This method patches the version, pushes to CI, and lets GitHub Actions handle the publishing:

```bash
# Use the make command (see Makefile section below)
make publish

# This will:
# 1. Verify you're authenticated as justbecauselabs
# 2. Run tests
# 3. Patch version (increment patch number)
# 4. Push tag to trigger CI/CD
# 5. Let GitHub Actions publish to npm
```

### Method 2: Manual Publishing

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Test package locally
npm pack --dry-run
npm pack
npm install -g ./gsum-*.tgz

# 3. Test functionality
gsum --version
gsum fingerprint .

# 4. Publish to npm
npm publish

# 5. Create git tag and push
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

## Package Configuration

### package.json Key Fields
```json
{
  "name": "gsum",
  "version": "1.0.0",
  "bin": {
    "gsum": "./bin/gsum.js"
  },
  "files": [
    "bin/",
    "lib/",
    "cli/",
    "scripts/",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  "keywords": [
    "cli", "ai", "codebase", "summary", "analysis",
    "gemini", "claude", "developer-tools"
  ]
}
```

### .npmignore
```
# Development files
.git/
.github/
test.sh
Makefile
install.sh

# MCP server (not part of npm package)
mcp-server/

# Keep for npm:
# - bin/, lib/, cli/
# - README.md, CHANGELOG.md, LICENSE
# - package.json
```

## Testing Before Publishing

### Local Testing
```bash
# Create test package
npm pack

# Test installation
mkdir test-install && cd test-install
npm install ../gsum-*.tgz

# Test functionality
npx gsum --version
npx gsum fingerprint .
```

### CI Testing
All tests must pass before publishing:
- Unit tests (51 comprehensive tests)
- Node.js compatibility (16.x, 18.x, 20.x)
- Security audits
- Linting checks

## Version Management

### Versioning Strategy
- **Patch** (1.0.x): Bug fixes, minor improvements
- **Minor** (1.x.0): New features, functionality additions  
- **Major** (x.0.0): Breaking changes, major refactors

### Release Process
1. Update `CHANGELOG.md` with new features/fixes
2. Run `make publish` (automated) or `npm version [patch|minor|major]` (manual)
3. For manual: Push changes: `git push origin main --tags`
4. GitHub Actions automatically publishes to npm
5. Monitor npm downloads and user feedback

## Publishing Checklist

### Pre-publish
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite (`./test.sh`)
- [ ] Test npm package locally
- [ ] Verify version number
- [ ] Check npm registry availability
- [ ] Verify npm authentication

### Publish (Automated)
- [ ] Run `make publish`
- [ ] Monitor GitHub Actions workflow
- [ ] Verify npm package published
- [ ] Test installation: `npx gsum`

### Publish (Manual)
- [ ] `npm version [type]`
- [ ] `git push origin main --tags`
- [ ] Monitor GitHub Actions
- [ ] Verify npm package published
- [ ] Test installation: `npx gsum`

### Post-publish
- [ ] Update documentation
- [ ] Announce on relevant platforms
- [ ] Monitor downloads and issues
- [ ] Respond to community feedback

## Usage Examples

### As npm Package
```bash
# Project analysis
npx gsum

# Focus on specific areas  
npx gsum --focus frontend

# Interactive mode
npx gsum interactive

# In package.json scripts
{
  "scripts": {
    "analyze": "gsum save --force",
    "overview": "gsum fingerprint"
  }
}
```

### As Development Tool
```bash
# Full development setup
git clone https://github.com/justbecauselabs/gsum.git
cd gsum && make install

# Modify and test
# ... make changes ...
make install  # reinstall
```

## Troubleshooting

### Common Issues

**1. Package name conflicts**
```bash
npm search gsum  # Check availability
```

**2. Authentication errors**
```bash
npm login
npm whoami
```

**3. File permissions**
```bash
chmod +x bin/gsum.js
```

**4. Dependency issues**
```bash
cd cli && npm audit fix
```

**5. "Cannot publish over existing version"**
```bash
npm version patch
npm publish
```

**6. "E403 Forbidden"**
- Check you're logged in: `npm whoami`
- Verify package name in package.json
- Ensure you have publish rights

### First Time Publishing Steps

```bash
# One-time setup
npm login

# Verify availability
npm view gsum  # Should show 404 - this is good!

# Test locally
npm pack
npm install -g ./gsum-*.tgz
gsum --version

# Publish
npm publish

# Verify
npx gsum --version
```

## Success Metrics

Track these metrics after npm publishing:
- **Weekly downloads**: Growth in npm installations
- **GitHub stars**: Repository popularity
- **Issue quality**: User experience feedback
- **CI/CD adoption**: Usage in build pipelines

## Distribution Benefits

### npm Distribution
- ✅ **Easy installation**: Single command
- ✅ **Dependency management**: Automatic
- ✅ **Version control**: Semantic versioning
- ✅ **Discoverability**: npm search
- ✅ **CI/CD friendly**: Works in pipelines

### Git Distribution  
- ✅ **Development flexibility**: Easy modifications
- ✅ **Latest features**: Always up-to-date
- ✅ **Full control**: Complete installation process
- ✅ **Additional tools**: Claude commands, etc.

## Post-Publish Tasks

### Update GitHub README

Add npm badges:
```markdown
# gsum - AI-Powered Codebase Summarization CLI

[![npm version](https://badge.fury.io/js/gsum.svg)](https://www.npmjs.com/package/gsum)
[![npm downloads](https://img.shields.io/npm/dm/gsum.svg)](https://www.npmjs.com/package/gsum)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### Monitor Usage
- **npm stats**: https://www.npmjs.com/package/gsum
- **npm-stat.com**: https://npm-stat.com/charts.html?package=gsum
- **GitHub issues**: Watch for user feedback
- **Weekly downloads**: Track growth

## Important Notes

### npm Policies
- **Cannot unpublish** after 24 hours (except security issues)
- Package names are **permanent** - "gsum" is yours forever
- Deprecated packages still take the name

### Version 0.1.0+
- Signals development stage (semantic versioning)
- Sets appropriate expectations
- Allows room for breaking changes before 1.0.0
- Future updates follow semver

---

**Ready to publish!** The gsum package is fully configured for npm distribution while maintaining the existing git-based installation method.