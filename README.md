# gsum - Smart AI Project Summarizer 🤖

**Three powerful commands to supercharge your Claude workflow.** Let Gemini analyze your codebase and create AI-ready documentation instantly.

## 🎯 Three Core Use Cases

### 1. `/gsum` - Ephemeral Context Loading
**WHY:** When you need Claude to understand your project RIGHT NOW for the current conversation.
- Always generates a fresh summary
- Outputs directly to the conversation
- Perfect for debugging sessions, feature development, or code reviews
- No files created or modified

### 2. `/gsum-save` - Persistent Architecture Documentation  
**WHY:** Maintain a living technical document that evolves with your codebase.
- Creates/updates `ARCHITECTURE.gsum.md` in your project
- Uses smart Git tracking - only regenerates after significant changes (500+ lines)
- Perfect for onboarding, documentation, and team knowledge sharing
- Version-controlled alongside your code

### 3. `/gsum-plan` - Automated Implementation Planning
**WHY:** Transform high-level ideas into detailed technical roadmaps.
- Takes a task description like "Add user authentication"
- Analyzes your codebase structure and patterns
- Generates a detailed `IMPLEMENTATION_PLAN_*.gsum.md` file
- Perfect for planning features, refactoring, or complex changes

## 🚀 Quick Start

### 1. Install (30 seconds)

```bash
git clone https://github.com/jhurray/gsum.git
cd gsum
make install
```

The installer will:
- ✅ Check for all required dependencies
- ✅ Install the gsum MCP server for Gemini
- ✅ Configure Gemini to use the MCP server
- ✅ Set up Claude commands
- ✅ Add necessary shell aliases

### 2. Use in Claude

```bash
# Quick context for current task
/gsum

# Create persistent documentation
/gsum-save

# Plan a new feature
/gsum-plan "Add real-time notifications"
```

That's it! 🎉

## 📋 .gitignore Recommendations

Based on your workflow, add these to your project's `.gitignore`:

```bash
# For /gsum users (ephemeral context)
# Nothing to ignore - outputs to stdout only

# For /gsum-save users (persistent documentation)
# DO NOT ignore - this should be version controlled!
# ARCHITECTURE.gsum.md is your living technical documentation

# For /gsum-plan users (implementation planning)
# These are task-specific and typically shouldn't be committed
IMPLEMENTATION_PLAN_*.gsum.md
```

**WHY these recommendations:**
- `ARCHITECTURE.gsum.md` is valuable documentation that should evolve with your code
- Implementation plans are usually temporary planning documents
- Ephemeral summaries never touch the filesystem

## 📸 What You'll See

### Ephemeral Context (`/gsum`)
```
/gsum

[Instant analysis of your project appears in Claude]
# PROJECT OVERVIEW
Your Next.js application with authentication...

# ARCHITECTURE OVERVIEW
The application follows a modular architecture...
[1000+ lines of context]
```

### Persistent Documentation (`/gsum-save`)
```
/gsum-save

⏺ No existing ARCHITECTURE.gsum.md found. Generating fresh summary...
⏺ Successfully generated ARCHITECTURE.gsum.md

# Next run with no changes:
/gsum-save
⏺ ARCHITECTURE.gsum.md is up to date (no changes since last summary).
```

### Implementation Planning (`/gsum-plan`)
```
/gsum-plan "Add user authentication"

⏺ Generating implementation plan for: Add user authentication
⏺ Output file: IMPLEMENTATION_PLAN_add_user_authentication.gsum.md
⏺ Successfully generated implementation plan
```

## 🤔 Why Three Commands?

### The Problem
Different development scenarios need different approaches:
- **Quick questions** don't need persistent files
- **Team documentation** should be version-controlled
- **Feature planning** needs dedicated analysis

### The Solution
Three specialized commands, each optimized for its use case:

| Command | Creates Files? | Git-Aware? | Best For |
|---------|---------------|------------|----------|
| `/gsum` | No | No | Quick context during coding |
| `/gsum-save` | Yes (tracked) | Yes | Living documentation |
| `/gsum-plan` | Yes (temp) | No | Feature planning |

## 🔧 How It Works

gsum uses a powerful MCP (Model Context Protocol) server that:
1. **Analyzes your codebase** - Respects .gitignore, detects tech stack
2. **Generates comprehensive documentation** - Tailored for AI consumption
3. **Integrates with Gemini** - Uses the `summarize_directory` tool
4. **Delivers to Claude** - Via the three specialized commands

The MCP server is automatically installed and configured during setup.

## 💡 Real Use Cases

### Case 1: Debugging Session
```
/gsum
Claude, I'm getting a TypeError in the auth flow
```
Claude instantly understands your entire auth architecture!

### Case 2: Onboarding New Developer
```
/gsum-save
git add ARCHITECTURE.gsum.md
git commit -m "Add architecture documentation"
```
New team members can read comprehensive docs in the repo!

### Case 3: Planning a Feature
```
/gsum-plan "Add webhook support for payments"
```
Get a detailed roadmap with specific files to modify!

## 🛠️ Advanced Usage

### Analyze Specific Directory
```bash
/gsum ./src/components
/gsum-save ./backend
/gsum-plan "Refactor database layer" ./src/db
```

### Update to Latest Version
```bash
cd gsum
make update  # Fetches from GitHub and reinstalls
```

### Customize Behavior
Edit `~/bin/smart-gsum` to adjust:
- `DIFF_THRESHOLD=500` - Lines changed before regenerating (for `/gsum-save`)

## 📋 Requirements

- **Claude Desktop** - With `/` commands enabled
- **Gemini CLI** - For AI-powered analysis
- **Node.js v18+** - Required for MCP server
- **npm** - For installing dependencies
- **Git** - For change tracking (optional for `/gsum`)
- **macOS/Linux** - Bash/Zsh shell

## ❓ FAQ

**Q: When should I use which command?**
A: 
- `/gsum` - Daily coding, debugging, quick questions
- `/gsum-save` - Documentation, team knowledge, architecture decisions
- `/gsum-plan` - Before starting new features or major changes

**Q: Should I commit ARCHITECTURE.gsum.md?**
A: Yes! It's valuable documentation that helps your team understand the codebase.

**Q: Can I use multiple commands?**
A: Absolutely! Many users run `/gsum-save` weekly and use `/gsum` daily.

**Q: How much does it cost?**
A: Uses your existing Gemini API quota. Smart caching in `/gsum-save` minimizes API calls.

**Q: What about private code?**
A: All analysis happens locally. Only sent to Gemini when generating summaries.

## 🐛 Troubleshooting

### Run Diagnostics First
```bash
smart-gsum --diagnose
```
This will check your entire gsum installation and identify any issues.

### Common Issues

#### "command not found"
```bash
source ~/.zshrc  # or ~/.bashrc
```

#### "Gemini not found"
Install Gemini CLI first: [Gemini CLI Guide](https://github.com/google/gemini-cli)

#### "Getting short/mock output (e.g., 67 lines)"
This usually means you have a mock `gemini` script intercepting calls:
```bash
# Check which gemini is being used
which gemini

# If it's in ~/bin/gemini, check if it's a mock
head ~/bin/gemini

# Fix by removing or renaming the mock
mv ~/bin/gemini ~/bin/gemini.mock
hash -r  # Clear shell's command cache

# Verify real Gemini is now found
which gemini  # Should show /opt/homebrew/bin/gemini or similar
```

#### "MCP server not working"
1. Ensure Node.js v18+ is installed: `node --version`
2. Check MCP server installation: `node ~/bin/gsum-mcp-server/index.js --version`
3. Restart Gemini CLI to load the MCP server
4. Check Gemini config: `cat ~/.config/gemini/config.json`

#### "Gemini API quota exceeded"
```
Error: Quota exceeded for quota metric 'Gemini 2.5 Pro Requests'
```
- Wait until tomorrow for quota reset
- Check your Google Cloud console for quota status
- Consider upgrading your API plan if needed

#### "summarize_directory tool not found"
The MCP server isn't properly connected to Gemini:
1. Restart Gemini CLI completely
2. Check ~/.config/gemini/config.json has the gsum MCP server configured
3. Ensure the MCP server path is correct and absolute

#### "Claude command not working"
Make sure you have Claude Desktop with slash commands enabled.

### Manual Validation Steps
```bash
# 1. Check if real Gemini CLI is installed
/opt/homebrew/bin/gemini --version

# 2. Test MCP server directly
node ~/bin/gsum-mcp-server/index.js --version

# 3. List Gemini's available tools
gemini --yolo << 'EOF'
List all available tools
EOF

# 4. Look for "summarize_directory" in the output
```

## 🤝 Contributing

Found a bug? Have an idea? PRs welcome!

```bash
gh repo fork jhurray/gsum
# make your changes
gh pr create
```

## 📄 License

MIT - Use it however you want!

---

Built to save time and context. If it helps you, ⭐ the repo!