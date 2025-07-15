# gsum Distribution Plan

## Overview

This document outlines the distribution strategy for gsum CLI, analyzing the current installation method vs npm distribution, and providing a roadmap for npm/npx support.

## Current Distribution Method

### How it works now:
- **Installation**: `git clone` + `make install`
- **Location**: `~/bin/gsum` wrapper script
- **Dependencies**: Manual `npm install` in `cli/` directory
- **Updates**: `git pull` + `make install`

### Pros of current method:
- ✅ Full control over installation process
- ✅ Works with development/local modifications
- ✅ No npm namespace conflicts
- ✅ Can include additional tooling (Claude commands, etc.)

### Cons of current method:
- ❌ Requires git and manual installation steps
- ❌ Not discoverable via npm search
- ❌ No automatic dependency management
- ❌ Higher barrier to entry for users

## Proposed npm Distribution

### Target User Experience:
```bash
# One-time usage
npx gsum

# Global installation
npm install -g gsum
gsum --help

# Local project installation
npm install --save-dev gsum
npx gsum --help
```

### Implementation Strategy

#### Phase 1: Prepare npm Package
1. **Package Structure**:
   ```
   gsum-cli/
   ├── package.json          # npm package metadata
   ├── bin/
   │   └── gsum.js           # CLI entry point with shebang
   ├── lib/                  # Core library modules
   ├── README.md             # npm-focused documentation
   └── CHANGELOG.md          # Version history
   ```

2. **Package.json Updates**:
   ```json
   {
     "name": "gsum",
     "version": "1.0.0",
     "description": "AI-powered codebase summarization CLI with smart context optimization",
     "main": "lib/index.js",
     "bin": {
       "gsum": "./bin/gsum.js"
     },
     "files": [
       "bin/",
       "lib/",
       "README.md",
       "CHANGELOG.md"
     ],
     "keywords": [
       "cli", "ai", "codebase", "summary", "analysis", 
       "gemini", "claude", "developer-tools"
     ],
     "repository": {
       "type": "git",
       "url": "https://github.com/justbecauselabs/gsum.git"
     },
     "homepage": "https://github.com/justbecauselabs/gsum#readme",
     "bugs": "https://github.com/justbecauselabs/gsum/issues"
   }
   ```

#### Phase 2: Dual Distribution
- Maintain current git-based installation for developers
- Add npm distribution for end users
- Both methods install the same CLI functionality

#### Phase 3: Publishing Automation
- GitHub Actions workflow for automated npm publishing
- Semantic versioning with git tags
- Automated changelog generation

## Technical Implementation

### 1. Restructure for npm

#### Current Structure:
```
gsum/
├── cli/
│   ├── gsum.js
│   ├── package.json
│   └── lib/
└── install.sh
```

#### Proposed npm Structure:
```
gsum/
├── package.json              # Root package for npm
├── bin/
│   └── gsum.js              # Entry point with proper shebang
├── lib/                     # All CLI modules
├── cli/                     # Keep for git-based installs
└── scripts/
    ├── install.sh           # Git installation
    └── publish.sh           # npm publishing
```

### 2. Package.json Configuration

```json
{
  "name": "gsum-cli",
  "version": "1.0.0",
  "description": "AI-powered codebase summarization CLI with smart context optimization",
  "main": "lib/index.js",
  "bin": {
    "gsum": "./bin/gsum.js"
  },
  "scripts": {
    "test": "./test.sh",
    "prepublishOnly": "npm test",
    "postinstall": "node scripts/postinstall.js"
  },
  "files": [
    "bin/",
    "lib/",
    "README.md",
    "CHANGELOG.md"
  ],
  "keywords": [
    "cli", "ai", "codebase", "summary", "analysis", 
    "gemini", "claude", "developer-tools", "smart-context",
    "focus-areas", "interactive", "fingerprint"
  ],
  "dependencies": {
    "commander": "^11.1.0",
    "glob": "^10.3.10",
    "micromatch": "^4.0.5"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/justbecauselabs/gsum.git"
  },
  "homepage": "https://github.com/justbecauselabs/gsum#readme",
  "bugs": {
    "url": "https://github.com/justbecauselabs/gsum/issues"
  },
  "author": "justbecauselabs",
  "license": "MIT"
}
```

### 3. Entry Point (bin/gsum.js)

```javascript
#!/usr/bin/env node
// npm-compatible entry point
const path = require('path');
const { program } = require('commander');

// Import CLI logic from lib
const { setupCommands } = require('../lib/cli');

// Set up and run CLI
setupCommands(program);
program.parse();
```

### 4. Publishing Workflow

```yaml
# .github/workflows/npm-publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Distribution Comparison

| Feature | Current (git) | npm/npx | Hybrid |
|---------|---------------|---------|---------|
| **Installation** | `git clone` + `make install` | `npm i -g gsum-cli` | Both methods |
| **Discovery** | GitHub search | npm search | Both |
| **Updates** | `git pull` + `make install` | `npm update -g` | User choice |
| **Dependencies** | Manual | Automatic | Automatic |
| **Development** | Easy local changes | Package updates only | Both |
| **Barrier to entry** | High | Low | Low |
| **Version management** | Git tags | npm versions | Synchronized |

## Recommended Approach: Hybrid Distribution

### For End Users:
```bash
# Quick try
npx gsum

# Install globally
npm install -g gsum
```

### For Developers/Contributors:
```bash
# Development setup
git clone https://github.com/justbecauselabs/gsum.git
cd gsum
make install
```

### For Organizations:
```bash
# Add to project
npm install --save-dev gsum

# In package.json scripts
{
  "scripts": {
    "analyze": "gsum save --force",
    "plan": "gsum plan"
  }
}
```

## Implementation Checklist

### Phase 1: Prepare for npm
- [ ] Restructure package for npm compatibility
- [ ] Update package.json with npm metadata
- [ ] Create proper bin entry point with shebang
- [ ] Add npm-focused README
- [ ] Test local npm pack/install

### Phase 2: Publishing Setup
- [ ] Register npm package name "gsum"
- [ ] Set up npm publishing workflow
- [ ] Create changelog automation
- [ ] Test publishing to npm (dry run)

### Phase 3: Launch
- [ ] Publish v1.0.0 to npm
- [ ] Update documentation with npm instructions
- [ ] Announce on GitHub and relevant communities
- [ ] Monitor adoption and feedback

### Phase 4: Maintenance
- [ ] Automated publishing on version tags
- [ ] Keep git and npm versions synchronized
- [ ] Regular dependency updates
- [ ] Community feedback integration

## Benefits of npm Distribution

1. **Discoverability**: Users can find gsum via `npm search`
2. **Ease of use**: Single command installation
3. **Dependency management**: npm handles all dependencies
4. **Version control**: Semantic versioning with automatic updates
5. **Integration**: Works with project package.json scripts
6. **CI/CD friendly**: Easy to include in build pipelines

## Migration Path

### Week 1: Preparation
- Restructure for npm compatibility
- Test local npm installation
- Create publishing workflow

### Week 2: Testing
- Private npm publish for testing
- Validate installation across platforms
- Update documentation

### Week 3: Launch
- Public npm publish
- Update README with npm instructions
- Announce to community

### Ongoing: Dual Support
- Maintain both distribution methods
- Sync versions between git tags and npm
- Monitor usage patterns and feedback

## Success Metrics

- **npm downloads**: Track weekly/monthly downloads
- **GitHub stars**: Monitor repository growth
- **Issues/feedback**: Quality of user experience
- **Adoption**: Usage in CI/CD pipelines
- **Community**: Contributions and feature requests

---

*This distribution plan balances ease of use for end users with flexibility for developers, positioning gsum for broader adoption while maintaining development velocity.*