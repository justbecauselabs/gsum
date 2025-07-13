# Updated gsum Command Flow (Post-JHNOTE)

## 📦 Installation Process (`make install`)

1. **Prerequisites Check**
   - Git, Node.js v16+, npm (required)
   - Gemini CLI (optional but recommended)

2. **Installation**
   - Installs npm dependencies
   - Creates wrapper at `~/bin/gsum`
   - Adds ~/bin to PATH

3. **Verification** ✅ NEW
   - Tests `gsum version` works
   - Shows installation path via `which gsum`
   - Displays version number

## 🚀 Default Command (`gsum`)

1. **Analysis** (all done by gsum CLI, no MCP)
   - Scans directory structure
   - Detects tech stack
   - Extracts project metadata

2. **Generation**
   - Builds comprehensive prompt
   - Sends to Gemini CLI via stdin
   - NO MCP dependencies - Gemini uses its own tools

3. **Error Handling** ✅ IMPROVED
   - If quota exceeded, shows 3 options:
     - `--fallback`: Generate Claude prompt
     - `--claude-execute`: Try Claude CLI directly
     - Wait for quota reset

## 💾 Save Command (`gsum save`)

1. **Git Checking**
   - Reads existing file's git hash
   - Compares with current HEAD
   - Skips if <500 lines changed

2. **Saves with Metadata** ✅ IMPROVED
   ```
   [document content]
   
   <!-- git-hash: abc123 -->
   <!-- git-branch: main -->
   ```

## 📋 Plan Command (`gsum plan "task"`)

✅ **IMPROVED Requirements:**
- Clear, actionable steps
- Specific file paths and commands
- Code examples with context
- Edge case handling
- Verification steps
- Fact-checked and complete

## 🆕 New Features

### `gsum llm-usage`
Shows comprehensive guide for LLMs on how to use gsum

### `--fallback` Option
Generates detailed prompt for Claude when Gemini quota exceeded

### `--claude-execute` Option
Experimental: Tries to run directly with Claude CLI (requires claude --dangerous support)

## 🤖 Claude Commands

✅ **Always Overwritten** on install/update to ensure latest version

## Key Improvements

1. **No MCP Dependencies** - Completely standalone CLI
2. **Better Error Messages** - Clear options when things fail
3. **Enhanced Git Tracking** - Branch info included
4. **Robust Installation** - Verification steps added
5. **LLM-Friendly** - New command for AI assistants