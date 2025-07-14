# gsum Troubleshooting Guide

## Installation Issues

### gsum: command not found

If `gsum` is not found after installation:

1. **Reload your shell**:
   ```bash
   source ~/.bashrc  # or ~/.zshrc
   ```

2. **Check if ~/bin is in PATH**:
   ```bash
   echo $PATH | grep ~/bin
   ```

3. **Verify installation**:
   ```bash
   ls -la ~/bin/gsum
   ```

4. **Run directly**:
   ```bash
   ~/bin/gsum --version
   ```

### Node.js Version Issues

If you see errors about unsupported Node.js features:

```bash
node --version  # Should be v16 or higher
```

Update Node.js from [nodejs.org](https://nodejs.org/) if needed.

## Claude Command Issues

### Command Not Recognized in Claude

If Claude doesn't recognize `/gsum`, `/gsum-save`, or `/gsum-plan`:

1. **Restart Claude Desktop** - Claude loads commands at startup
2. **Verify command installation**:
   ```bash
   ls -la ~/.claude/commands/gsum*.md
   ```
3. **Install Claude commands**:
   ```bash
   make install-commands
   ```

### Command Runs But No Output

Check if the wrapper script exists:
```bash
ls -la ~/bin/claude-gsum-wrapper
cat ~/bin/claude-gsum-wrapper
```

## Gemini API Issues

### Quota Exceeded

When you see "❌ ERROR: Gemini API quota exceeded":

1. **Use fallback mode**:
   ```bash
   gsum --fallback
   ```

2. **Copy the generated prompt to Claude**

3. **Wait for quota reset** (usually daily)

### Gemini Not Found

If gsum works but complains about Gemini:

1. Gemini is optional but recommended
2. Install Gemini CLI for best results
3. gsum will work without it but with reduced functionality

### Authentication Errors

Check Gemini configuration:
```bash
cat ~/.config/gemini/config.json
```

## Generation Issues

### Empty or Poor Quality Summaries

1. **Check verbose output**:
   ```bash
   gsum -v
   ```

2. **Enable debug mode**:
   ```bash
   gsum -d
   ```

3. **Verify project has analyzable files**:
   ```bash
   gsum -v | grep "Files analyzed"
   ```

### Summary Not Updating

For saved summaries that won't update:

1. **Check git status**:
   ```bash
   git status
   git diff --stat
   ```

2. **Force regeneration**:
   ```bash
   gsum save --force
   ```

3. **Check stored git hash**:
   ```bash
   grep "git-hash" ARCHITECTURE.gsum.md
   ```

## Performance Issues

### Slow Analysis

For large codebases:

1. **Limit depth**:
   ```bash
   gsum --depth 5
   ```

2. **Exclude unnecessary files**:
   ```bash
   gsum --exclude "dist/**,build/**,*.min.js"
   ```

3. **Check what's being analyzed**:
   ```bash
   gsum -v | grep "Analyzing"
   ```

### Command Times Out

If gsum times out during AI generation:

1. **Increase timeout** (default is 5 minutes):
   ```bash
   export GSUM_TIMEOUT=600000  # 10 minutes in milliseconds
   gsum save
   ```

2. **Enable verbose mode** to see progress:
   ```bash
   gsum -v
   # Shows real-time progress like: ⏳ Gemini is processing.... (45s)
   ```

3. **For very large codebases**, consider:
   - Using `--context-level minimal` for faster generation
   - Focusing on specific directories: `gsum src/api`
   - Using `--focus` to limit scope: `gsum --focus frontend`

### No Progress Visible

If you don't see progress indicators:

1. **In Claude Code**: gsum auto-detects Claude Code and enables verbose mode
   ```bash
   # Check if Claude Code is detected
   echo $CLAUDE_CODE
   echo $CLAUDE_DESKTOP_TOOLS_ACTIVE
   ```

2. **Manual verbose mode**:
   ```bash
   gsum -v  # or --verbose
   ```

3. **Check terminal compatibility**: Progress indicators use ANSI escape codes

## Update Issues

### Update Command Fails

If `gsum update` fails:

1. **Manual update**:
   ```bash
   cd ~/src/gsum  # or wherever gsum is installed
   git pull origin main
   make install
   ```

2. **Check git remote**:
   ```bash
   cd ~/src/gsum
   git remote -v
   ```

3. **Clean install**:
   ```bash
   make clean
   make install
   ```

## Debug Mode

Enable comprehensive debugging:

```bash
# Set environment variable
export GSUM_DEBUG=1

# Or use debug flag
gsum -d

# Check all verbose output
gsum -d 2>&1 | tee gsum-debug.log
```

## Common Error Messages

### "Cannot find module 'commander'"

Dependencies not installed:
```bash
cd ~/src/gsum/cli
npm install
```

### "Gemini CLI not found"

This is a warning, not an error. gsum works without Gemini but with limited functionality.

### "Git hash unchanged - skipping regeneration"

This is expected behavior. Use `--force` to override:
```bash
gsum save --force
```

## Getting Help

1. **Check version**:
   ```bash
   gsum version
   ```

2. **View all options**:
   ```bash
   gsum --help
   gsum save --help
   ```

3. **Report issues**:
   Visit [github.com/jhurray/gsum/issues](https://github.com/jhurray/gsum/issues)