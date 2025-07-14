# 🚀 npm Publishing Checklist for gsum

This guide walks you through publishing gsum to npm for the first time.

## Prerequisites

- Node.js and npm installed
- The gsum repository cloned locally
- All tests passing (`./test.sh`)

## 🚀 Publishing Steps

### 1. Create npm Account (if needed)

```bash
# Option A: Via website
# Go to https://www.npmjs.com/signup

# Option B: Via CLI
npm adduser
```

### 2. Login to npm

```bash
npm login
# Enter your username, password, and email
# You may need to complete 2FA if enabled
```

### 3. Verify You're Logged In

```bash
npm whoami
# Should show your npm username
```

### 4. Check Package Name Availability ✅

```bash
npm view gsum
# Should show "npm ERR! 404 Not Found" 
# This is GOOD - it means "gsum" is available!
```

### 5. Test Package Locally One More Time

```bash
# From the gsum root directory
cd /Users/jhurray/src/gsum

# Create package
npm pack

# Test global installation
npm install -g ./gsum-0.1.0.tgz

# Verify it works
gsum --version              # Should show 0.1.0
gsum fingerprint .          # Test basic functionality
gsum --help                 # Check help text

# Clean up test installation
npm uninstall -g gsum
rm gsum-0.1.0.tgz
```

### 6. Final Pre-publish Checks

```bash
# Check what will be published
npm publish --dry-run

# Review the file list - should include:
# - bin/gsum.js
# - cli/ (all files)
# - lib/index.js
# - scripts/postinstall.js
# - package.json, README.md, LICENSE, CHANGELOG.md
```

### 7. Publish to npm! 🎉

```bash
# Actually publish
npm publish

# You'll see output like:
# npm notice Publishing to https://registry.npmjs.org/
# + gsum@0.1.0
```

### 8. Verify Publication

```bash
# Check it's live (may take 1-2 minutes)
npm view gsum

# Test installation from npm registry
npm install -g gsum
gsum --version

# Try npx
npx gsum fingerprint
```

### 9. Create GitHub Release

```bash
# Tag the release
git tag v0.1.0 -m "Initial npm release"
git push origin v0.1.0

# This will trigger the npm-publish.yml workflow
# (once you add NPM_TOKEN to GitHub secrets)
```

## 🔐 Set Up Automated Publishing (for future releases)

### 1. Generate npm Token

1. Go to https://www.npmjs.com/
2. Click your profile → Access Tokens
3. Click "Generate New Token"
4. Choose "Automation" type
5. Copy the token (starts with `npm_`)

### 2. Add to GitHub Secrets

1. Go to https://github.com/jhurray/gsum/settings/secrets/actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click "Add secret"

### 3. Future Releases

Now you can publish by creating tags:

```bash
# Update version in package.json
npm version patch  # or minor/major

# Push with tags
git push origin main --tags

# GitHub Actions will automatically publish to npm!
```

## 📋 Post-Publish Tasks

### 1. Update GitHub README

Add npm badges to the top of README.md:

```markdown
# gsum - AI-Powered Codebase Summarization CLI

[![npm version](https://badge.fury.io/js/gsum.svg)](https://www.npmjs.com/package/gsum)
[![npm downloads](https://img.shields.io/npm/dm/gsum.svg)](https://www.npmjs.com/package/gsum)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### 2. Announce the Release

**Twitter/X Template:**
```
🚀 Just published gsum to npm!

AI-powered codebase summaries in seconds:
npx gsum

✨ Smart context levels
🎯 Focus on frontend/backend/database
🗺️ Instant project fingerprints
🤖 Works with Gemini & Claude

Try it on your project!
https://www.npmjs.com/package/gsum
```

**Dev.to/Reddit Post Ideas:**
- "Introducing gsum: AI-Powered Codebase Summaries"
- "How I Built a CLI Tool for Instant Project Documentation"
- "Stop Writing README Files - Let AI Do It"

### 3. Monitor Usage

- **npm stats**: https://www.npmjs.com/package/gsum
- **npm-stat.com**: https://npm-stat.com/charts.html?package=gsum
- **GitHub issues**: Watch for user feedback
- **Weekly downloads**: Track growth

## ⚠️ Important Notes

### Version 0.1.0
- Signals early development stage (semantic versioning)
- Sets appropriate expectations for an initial release
- Allows room for breaking changes before 1.0.0
- Future updates should follow semver

### npm Policies
- **Cannot unpublish** after 24 hours (except security issues)
- Package names are **permanent** - "gsum" is yours forever
- Deprecated packages still take the name

### First Publish Creates
- Package page: https://www.npmjs.com/package/gsum
- Download stats tracking
- Version history
- Dependency tracking

## 🎯 Quick Command Summary

```bash
# One-time setup
npm login

# Publish
cd /Users/jhurray/src/gsum
npm publish

# Verify
npx gsum --version
```

## 🐛 Troubleshooting

### "You must be logged in"
```bash
npm login
npm whoami  # Verify
```

### "Package name too similar"
The name "gsum" is available and not similar to existing packages.

### "Cannot publish over existing version"
You can only publish each version once. Bump the version:
```bash
npm version patch
npm publish
```

### "E403 Forbidden"
- Check you're logged in: `npm whoami`
- Verify package name in package.json
- Ensure you have publish rights

## 🎉 Success!

Once published, developers worldwide can use gsum:

```bash
# Users can now run
npx gsum

# Or install globally
npm install -g gsum

# Or add to projects
npm install --save-dev gsum
```

Congratulations on publishing your first npm package! 🚀

---

**Ready to publish?** Just run `npm publish` from the gsum directory!