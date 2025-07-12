# AI Context Summarizer 🤖📚

Save Claude's context window by using Gemini to generate detailed architecture documentation for your projects. This tool creates comprehensive technical specifications that serve as condensed context for AI agents.

## 🎯 What it does

- **Smart Summaries**: Generates detailed architecture docs only when needed
- **Git-Aware**: Tracks changes and shows diffs for minor updates
- **Branch Support**: Creates branch-specific summaries when switching branches
- **Context Optimization**: Offloads heavy analysis to Gemini, preserving Claude's context
- **One Command**: Simply type `/gsum` in Claude to analyze any directory

## 📋 Prerequisites

1. **Claude Desktop** with Claude Code CLI installed
2. **Gemini CLI** with MCP directory-summarizer tool
3. **Git** (for change tracking)
4. **macOS/Linux** with bash/zsh

## 🚀 Quick Install

```bash
curl -sSL https://raw.githubusercontent.com/jhurray/ai-context-summarizer/main/install.sh | bash
```

Or clone and install manually:

```bash
git clone https://github.com/jhurray/ai-context-summarizer.git
cd ai-context-summarizer
./install.sh
```

## 🛠️ Manual Setup

### 1. Install Gemini CLI with MCP support

Follow the [Gemini CLI installation guide](https://github.com/google/gemini-cli) and ensure you have the `summarize_directory` MCP tool available.

### 2. Add the shell alias

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
alias gyolo="gemini --yolo"
```

### 3. Copy the scripts

```bash
# Copy the smart summarizer script
cp bin/smart-gsum ~/bin/
chmod +x ~/bin/smart-gsum

# Copy the Gemini wrapper
cp bin/gsummarize-wrapper ~/bin/
chmod +x ~/bin/gsummarize-wrapper

# Create Claude command directory if it doesn't exist
mkdir -p ~/.claude/commands

# Copy the Claude slash command
cp claude-commands/gsum.md ~/.claude/commands/
```

### 4. Reload your shell

```bash
source ~/.zshrc  # or ~/.bashrc
```

## 📖 Usage

### In Claude

Simply type `/gsum` in any Claude conversation to analyze the current directory:

```
/gsum
```

Or analyze a specific directory:

```
/gsum /path/to/project
```

### What happens:

1. **First run**: Generates a comprehensive `DIRECTORY_SUMMARY.md` with ~1000+ lines of architecture documentation
2. **No changes**: Shows existing summary instantly
3. **Minor changes**: Shows existing summary + git diff
4. **Major changes**: Regenerates the full summary
5. **Branch switch**: Creates branch-specific summary if commits diverged

### Example Output

The generated `DIRECTORY_SUMMARY.md` includes:

- Project overview and purpose
- Setup instructions from README
- Complete architecture overview
- Directory structure with explanations
- Key modules and their responsibilities
- Database schemas and relationships
- API design and endpoints
- Frontend component hierarchy
- Business logic patterns
- Testing strategies
- Deployment configurations
- Security considerations
- Performance optimizations
- Code conventions and patterns
- Step-by-step guides for adding features

## 🔧 Configuration

### Adjust diff threshold

Edit `~/bin/smart-gsum` and change:

```bash
DIFF_THRESHOLD=500  # Lines of diff before regenerating
```

### Customize the summary format

Edit `~/bin/gsummarize-wrapper` to modify the architecture template.

## 🏗️ How it Works

1. **Claude Command** (`/gsum`): Triggers the smart summarizer
2. **Smart Summarizer** (`smart-gsum`): 
   - Checks for existing summaries
   - Compares git hashes
   - Decides whether to regenerate or show cached version
3. **Gemini Wrapper** (`gsummarize-wrapper`):
   - Sends detailed instructions to Gemini
   - Uses MCP tool to analyze directory
   - Creates DIRECTORY_SUMMARY.md
4. **Git Integration**:
   - Stores commit hash in summary
   - Tracks changes between summaries
   - Handles branch switches gracefully

## 🎨 Architecture

```
ai-context-summarizer/
├── bin/
│   ├── smart-gsum              # Main logic for smart summaries
│   └── gsummarize-wrapper      # Gemini MCP wrapper
├── claude-commands/
│   └── gsum.md                 # Claude slash command definition
├── install.sh                  # One-command installer
└── README.md                   # This file
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 🙏 Credits

Created by [@jhurray](https://github.com/jhurray) to optimize AI agent context usage.

---

**Note**: This tool respects `.gitignore` and skips `node_modules`, build outputs, and other generated files to focus on actual source code and architecture.