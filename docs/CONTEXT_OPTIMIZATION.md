# gsum Context & Token Optimization Strategies

## Current State Analysis

gsum currently generates ~10,000 word summaries that include:
- Full architectural documentation (18 sections)
- Comprehensive project analysis
- Code examples from the project

**Problem**: This might be too verbose for Claude's context window and doesn't optimize for the specific information Claude needs most.

## Proposed Improvements

### 1. **Smart Context Levels** 🎯
Add context level options: `--context-level <minimal|standard|comprehensive>`
- **minimal**: Core architecture + key files (2-3k words)
- **standard**: Important modules + patterns (5-7k words) 
- **comprehensive**: Full analysis (current 10k+ words)

**Benefit**: Users can choose based on their context window budget

### 2. **Focus Areas** 🔍
Add `--focus <area>` to generate targeted summaries:
```bash
gsum --focus frontend     # Only React/Vue/UI components
gsum --focus api          # Only backend/API endpoints
gsum --focus database     # Only models/schemas
gsum --focus testing      # Only test structure
```

**Benefit**: Get exactly what you need for the current task

### 3. **Incremental Context Building** 📚
New command: `gsum context <file/directory>`
```bash
gsum context src/api      # Adds just API context
gsum context src/auth     # Adds auth module
gsum context --show       # Shows accumulated context
gsum context --clear      # Resets context
```

**Benefit**: Build up only the context you need progressively

### 4. **Diff-Based Summaries** 🔄
For existing projects with saved summaries:
```bash
gsum diff                 # Show only what changed since last summary
gsum diff --since abc123  # Changes since specific commit
```

**Benefit**: Minimal tokens for updates, not full regeneration

### 5. **Smart File Inclusion** 📄
Automatically include most relevant files based on:
- Recent git changes
- Import frequency (files imported by many others)
- File complexity scores
- User's recent edits

Config option: `--smart-files 10` (include top 10 most relevant files)

**Benefit**: AI-determined relevance = better context

### 6. **Token Budget Mode** 💰
Specify exact token budget:
```bash
gsum --max-tokens 4000    # Generates summary within token limit
gsum --estimate           # Shows token count without generating
```

**Benefit**: Precise control over context window usage

### 7. **Interactive Mode** 🎮
```bash
gsum interactive
> Include frontend? [Y/n]
> Include tests? [y/N]
> Focus on recent changes? [Y/n]
> Max depth for components? [3]
```

**Benefit**: Customize exactly what goes into the summary

### 8. **Codebase Fingerprint** 🗺️
Ultra-compressed project overview:
```bash
gsum fingerprint
# Outputs:
# Tech: React/TypeScript/Node.js
# Structure: Monorepo with 3 packages
# Key files: 127 (.ts: 89, .tsx: 38)
# Patterns: Redux state, REST API
# Dependencies: 47 prod, 23 dev
```

**Benefit**: Maximum info in minimum tokens

### 9. **Question-Driven Summaries** ❓
Generate summaries optimized for specific questions:
```bash
gsum --for "adding user authentication"
# Focuses on: auth flows, user models, session handling, middleware
```

**Benefit**: Context tailored to the task at hand

### 10. **Summary Caching & Composition** 🧩
Cache component summaries and compose on demand:
```bash
gsum cache src/components   # Pre-summarize and cache
gsum cache src/api          # Pre-summarize and cache
gsum compose auth-flow      # Combines relevant cached summaries
```

**Benefit**: Reusable components = less regeneration

## Recommended Priority

**High Impact + Easy to Implement:**
1. Smart Context Levels (#1)
2. Token Budget Mode (#6)
3. Focus Areas (#2)

**High Impact + Medium Complexity:**
4. Diff-Based Summaries (#4)
5. Question-Driven Summaries (#9)

**Nice to Have:**
6. Everything else

## Implementation Considerations

- Each feature should integrate with existing git-aware intelligence
- Token counting should use tiktoken or similar for accuracy
- Context levels should have sensible defaults per project type
- All features should work with both ephemeral and saved modes