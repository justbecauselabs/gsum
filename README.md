# gsum - Smart AI Project Summarizer 🤖

**Stop wasting Claude's context window!** Let Gemini analyze your codebase and create detailed technical documentation that Claude can reference instantly.

## 🎯 What is gsum?

gsum creates **smart, git-aware project summaries** that:
- 📚 Generate 1000+ line technical specifications of your codebase
- 🔄 Only regenerate when you have significant changes
- 💾 Cache summaries to save API calls and time
- 🌿 Track different branches separately

## 🚀 Quick Start

### 1. Install (30 seconds)

```bash
git clone https://github.com/jhurray/gsum.git
cd gsum
make install
```

### 2. Use in Claude

Just type in any Claude conversation:

```
/gsum
```

That's it! 🎉

## 📸 What You'll See

### First Run
```
/gsum

⏺ No existing summary found. Generating fresh summary...
⏺ Analyzing project structure...
⏺ Created DIRECTORY_SUMMARY.md (73KB, 1335 lines)
```

### No Changes
```
/gsum

⏺ Summary is up to date (no changes since last summary).
⏺ Loading existing summary...
[Shows your cached 1000+ line technical spec]
```

### Minor Changes
```
/gsum

⏺ Changes are trivial. Loading existing summary with diff...
=== EXISTING SUMMARY ===
[Shows cached summary]
=== CHANGES SINCE LAST SUMMARY ===
From: abc123
To:   def456
 src/components/Button.tsx | 5 +++++
 1 file changed, 5 insertions(+)
```

## 🤔 Why Use This?

### The Problem
Every time you ask Claude about your project, you waste context explaining:
- What files exist
- How they connect
- What patterns you use
- Your project structure

### The Solution
gsum pre-analyzes everything with Gemini and creates a comprehensive technical document that includes:

- **Project Overview** - Purpose, features, current status
- **Setup Instructions** - How to install and run
- **Architecture** - How everything fits together
- **Directory Structure** - What goes where and why
- **Key Components** - Deep dive into each module
- **Database Schema** - Tables, relationships, queries
- **API Design** - Endpoints, auth, patterns
- **Code Examples** - Real snippets from your project
- **Development Workflow** - How to add features
- **And much more...**

## 💡 Real Use Cases

### Case 1: "Help me add a new feature"
```
/gsum
Claude, I need to add user notifications to this app
```
Claude now knows your entire architecture and can give specific guidance!

### Case 2: "Fix this bug"
```
/gsum
Getting TypeError in production, help me debug
```
Claude understands your error handling patterns and can pinpoint issues!

### Case 3: "Code review"
```
/gsum
Review my recent changes and suggest improvements
```
Claude sees what changed and knows your coding standards!

## 🛠️ Advanced Usage

### Analyze Specific Directory
```
/gsum /path/to/project
```

### Update to Latest Version

If you cloned the repo:
```bash
cd gsum
make install  # This updates existing installations too
```

Or pull latest changes from GitHub:
```bash
cd gsum
make update  # Fetches from GitHub and updates
```

### Customize Behavior
Edit `~/bin/smart-gsum` to adjust:
- `DIFF_THRESHOLD=500` - How many lines before regenerating

## 📋 Requirements

- **Claude Desktop** - With `/` commands enabled
- **Gemini CLI** - With MCP tools
- **Git** - For change tracking
- **macOS/Linux** - Bash/Zsh shell

## ❓ FAQ

**Q: Does this work with any project?**
A: Yes! Works with any programming language or framework.

**Q: How much does it cost?**
A: Uses your existing Gemini API quota. Smart caching minimizes API calls.

**Q: Can I customize the summary format?**
A: Yes! Edit `~/bin/gsummarize-wrapper` to modify the template.

**Q: Where are summaries stored?**
A: In your project as `DIRECTORY_SUMMARY.md` (git-ignored by default).

**Q: What about private code?**
A: Summaries stay local. Only sent to Gemini when generating.

## 🐛 Troubleshooting

### "command not found: gsum"
```bash
source ~/.zshrc  # or ~/.bashrc
```

### "Gemini not found"
Install Gemini CLI first: [Gemini CLI Guide](https://github.com/google/gemini-cli)

### "Claude command not working"
Make sure you have Claude Desktop with slash commands enabled.

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