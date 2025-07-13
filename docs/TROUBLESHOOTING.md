# gsum Troubleshooting Guide

## Command Not Recognized in Claude

If Claude doesn't recognize `/gsum-save` or other gsum commands:

1. **Restart Claude** - Claude loads command files at startup and doesn't dynamically reload
2. **Verify Installation**:
   ```bash
   ls -la ~/.claude/commands/gsum*.md
   ```
3. **Check Command Format**:
   ```bash
   cat ~/.claude/commands/gsum-save.md
   ```

## Expected Behavior

When properly installed and Claude is restarted, typing `/gsum-save` should:
1. Show the command is running with allowed tools
2. Display version info like: `📦 gsum version: d11e28b - fix: Improve...`
3. Execute `claude-gsum-wrapper save`

## Debug Commands

If issues persist after restart:
```bash
# Validate setup
/Users/jhurray/src/gsum/bin/validate-gsum-commands

# Check debug logs
ls -la ~/.gsum-debug/
cat ~/.gsum-debug/latest.log
```

## Common Issues

### "command not found: gsum-save"
- Claude is trying to run as bash command instead of slash command
- **Solution**: Restart Claude to load command files

### Poor Quality Output (Basic Stats Only)
- Gemini is generating basic directory summaries instead of architectural docs
- **Solution**: Check if Gemini quota is exhausted, use Claude fallback

### Gemini Quota Exceeded
- You'll see: "❌ ERROR: Gemini API quota exceeded"
- **Solution**: Type 'y' when prompted to use Claude Code fallback