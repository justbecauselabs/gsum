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

**Note for Claude Code users**: Claude Code has a 2-minute command timeout that overrides gsum's timeout. For longer operations, run gsum directly in your terminal instead of through Claude Code commands.

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
   
4. **Quick workaround for timeouts**:
   ```bash
   # Use minimal context level for faster generation
   gsum save --context-level minimal
   
   # Or use standard instead of comprehensive
   gsum save --context-level standard
   ```

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

## Claude Optimization Issues

### Cache Not Being Used

If Claude optimization isn't using cached context:

1. **Check cache exists**:
   ```bash
   ls -la .gsum/
   cat .gsum/cache-metadata.json
   ```

2. **Force cache refresh**:
   ```bash
   rm -rf .gsum/
   gsum --claude-optimized
   ```

3. **Verify Claude Code detection**:
   ```bash
   gsum -v | grep "Detected Claude Code"
   ```

### Wrong Output Format

If output doesn't look Claude-optimized:

1. **Explicitly enable**:
   ```bash
   gsum --claude-optimized
   ```

2. **Check verbose output**:
   ```bash
   gsum --claude-optimized -v
   # Should show: "🚀 Generating Claude-optimized context"
   ```

### Plan Command Not Using Cache

For `gsum plan` cache issues:

1. **Use fresh flag to bypass cache**:
   ```bash
   gsum plan "task" --fresh
   ```

2. **Check if cache is stale**:
   ```bash
   # Cache expires after 1 hour by default
   cat .gsum/cache-metadata.json | grep lastUpdate
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

### "gsum plan" Fails

If `gsum plan` fails with "Gemini did not generate any content":

1. **Ensure your task is properly quoted**:
   ```bash
   gsum plan "implement user authentication"  # Good
   gsum plan implement user authentication    # Bad - only "implement" is used
   ```

2. **Try with verbose mode**:
   ```bash
   gsum plan -v "your task here"
   ```

3. **Use a context file for complex tasks**:
   ```bash
   echo "Detailed requirements here" > context.md
   gsum plan -c context.md "implement feature X"
   ```

4. **Check if the issue is with file creation**:
   ```bash
   ls -la .gsum_plan_*.md  # Check for any plan files
   ```

### "Gemini did not create the expected file"

If you see this error after Gemini runs successfully:

1. **Enable debug mode to see what's happening**:
   ```bash
   gsum save -d
   ```

2. **Check if Gemini is creating files with a different name**:
   ```bash
   ls -la *.md | grep -E "(ARCH|gsum|GSUM)"
   ```

3. **Verify Gemini has write permissions**:
   ```bash
   touch test.md && rm test.md
   ```

4. **Try running Gemini directly** to see its output:
   ```bash
   cd /path/to/project
   gemini --yolo
   # Then paste a simple prompt like: Create a file called test.md with the content "Hello World"
   ```

5. **Check if the prompt is being passed correctly**:
   ```bash
   gsum save -d 2>&1 | grep "Output filename in prompt"
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