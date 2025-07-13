# npm Publishing Guide for gsum-cli

## Overview

This guide covers how to publish gsum-cli to npm and the setup that enables both npm and git-based installation methods.

## Current Status ✅

The gsum project is now configured for **dual distribution**:

### 1. npm/npx Installation (Ready to publish)
```bash
# One-time usage
npx gsum-cli

# Global installation
npm install -g gsum-cli

# Project dependency
npm install --save-dev gsum-cli
```

### 2. Git Installation (Current method)
```bash
git clone https://github.com/jhurray/gsum.git
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

## Publishing Steps

### Prerequisites

1. **npm Account**: Create account at https://npmjs.com
2. **npm Token**: Generate authentication token
3. **Package Name**: Verify "gsum-cli" is available
4. **GitHub Secrets**: Add `NPM_TOKEN` to repository secrets

### Manual Publishing

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Test package
npm pack --dry-run
npm pack
npm install -g ./gsum-cli-*.tgz

# 3. Test functionality
gsum --version
gsum fingerprint .

# 4. Publish to npm
npm publish

# 5. Create git tag
git tag v$(node -p "require('./package.json').version")
git push origin --tags
```

### Automated Publishing

The GitHub Actions workflow (`.github/workflows/npm-publish.yml`) automatically publishes to npm when you push a version tag:

```bash
# Update version and push tag
npm version patch
git push origin main --tags

# This triggers:
# 1. Run tests
# 2. Build package
# 3. Publish to npm
# 4. Create GitHub release
```

## Package Configuration

### package.json Key Fields
```json
{
  "name": "gsum-cli",
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

## Usage Examples

### As npm Package
```bash
# Project analysis
npx gsum-cli

# Focus on specific areas  
npx gsum-cli --focus frontend

# Interactive mode
npx gsum-cli interactive

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
git clone https://github.com/jhurray/gsum.git
cd gsum && make install

# Modify and test
# ... make changes ...
make install  # reinstall
```

## Version Management

### Versioning Strategy
- **Patch** (1.0.x): Bug fixes, minor improvements
- **Minor** (1.x.0): New features, functionality additions  
- **Major** (x.0.0): Breaking changes, major refactors

### Release Process
1. Update `CHANGELOG.md` with new features/fixes
2. Run `npm version [patch|minor|major]`
3. Push changes: `git push origin main --tags`
4. GitHub Actions automatically publishes to npm
5. Monitor npm downloads and user feedback

## Testing Before Publishing

### Local Testing
```bash
# Create test package
npm pack

# Test installation
mkdir test-install && cd test-install
npm install ../gsum-cli-*.tgz

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

## Publishing Checklist

### Pre-publish
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite (`./test.sh`)
- [ ] Test npm package locally
- [ ] Verify version number
- [ ] Check npm registry availability

### Publish
- [ ] `npm version [type]`
- [ ] `git push origin main --tags`
- [ ] Monitor GitHub Actions
- [ ] Verify npm package published
- [ ] Test installation: `npx gsum-cli`

### Post-publish
- [ ] Update documentation
- [ ] Announce on relevant platforms
- [ ] Monitor downloads and issues
- [ ] Respond to community feedback

## Troubleshooting

### Common Issues

**1. Package name conflicts**
```bash
npm search gsum-cli  # Check availability
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

### Support Channels
- GitHub Issues: Bug reports and feature requests
- npm package page: Download stats and versions
- Documentation: README and docs/ folder

## Success Metrics

Track these metrics after npm publishing:
- **Weekly downloads**: Growth in npm installations
- **GitHub stars**: Repository popularity
- **Issue quality**: User experience feedback
- **CI/CD adoption**: Usage in build pipelines

---

**Ready to publish!** The gsum-cli package is fully configured for npm distribution while maintaining the existing git-based installation method.