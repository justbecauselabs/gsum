# gsum Refactor Plan: Maximum Context ROI for Claude Code

## Core Problem

**Goal**: Give Claude Code the highest-value context with maximum accuracy using minimal tokens, eliminating the need for expensive discovery during active sessions.

**Current Issues**:
- Claude Code 2-minute timeout vs gsum's 5-minute processing
- Claude wastes tokens on file discovery instead of productive work
- Repeated expensive analysis every session
- No intelligent pre-processing of codebase context

## Solution: Gemini-Powered Context Pre-Processing

**Strategy**: Use Gemini's strengths (analysis, summarization, no timeouts) to create optimized context packages that Claude Code can consume instantly.

### The New Workflow

1. **`gsum save`** - Run periodically to update comprehensive docs + Claude context cache
2. **`gsum`** - Instant Claude-optimized context using cache or fast local analysis
3. **`gsum plan`** - Task-specific guidance with relevant files pre-selected

### Core Commands (Enhanced for Claude Code)

#### `gsum` - Ephemeral Claude-Optimized Context
Default behavior enhanced for Claude Code efficiency:

```bash
# Auto-detects Claude Code and optimizes output
gsum

# Force Claude optimization even outside Claude Code
gsum --claude-optimized

# Include smart file contents in context
gsum --smart-files 10
```

**What it does**:
- Detects Claude Code environment automatically
- Uses analyzer for fast local analysis
- Optionally calls Gemini for deeper insights (if time permits)
- Outputs token-optimized context directly to stdout
- Includes actionable file paths and code patterns

**Output**: 2k-4k tokens of immediately actionable context

#### `gsum save` - Persistent Architecture Documentation
Enhanced to create both human docs AND Claude-ready context:

```bash
# Creates ARCHITECTURE.gsum.md + .gsum/context.md
gsum save

# Force regeneration with Claude optimization
gsum save --force --claude-optimized
```

**What it does**:
- Generates comprehensive documentation (existing behavior)
- ALSO creates `.gsum/context.md` - Claude-optimized version
- Uses smart caching to avoid redundant Gemini calls
- Updates both files only when significant changes detected

**Outputs**: 
- `ARCHITECTURE.gsum.md` - Human-readable comprehensive docs
- `.gsum/context.md` - Claude-optimized context cache

#### `gsum plan <task>` - Task-Specific Implementation Guide
Enhanced with pre-computed context awareness:

```bash
# Uses cached context if available
gsum plan "add user authentication"

# Force fresh analysis
gsum plan "fix performance bug" --fresh

# Include more smart files for complex tasks
gsum plan "refactor API" --smart-files 20
```

**What it does**:
- Leverages existing analyzer + smart file selection
- Uses cached context from `.gsum/` if recent
- Focuses Gemini on task-specific insights
- Outputs step-by-step implementation with exact file paths

**Output**: Task-focused plan with 5-10 most relevant files included

## Implementation Strategy

### Division of Labor: Gemini vs Local vs Claude

**Gemini Handles** (Heavy Analysis):
- Complete codebase scanning and pattern recognition
- Smart file selection algorithms
- Code summarization and relationship mapping
- Task-specific context preparation
- Token optimization and compression

**Local Analysis** (Fast Operations):
- File system traversal and basic stats
- Git operations and change detection
- Cache validation and management
- Fingerprint generation

**Claude Gets** (Optimized Context):
- Pre-analyzed, condensed context
- Task-relevant file selections
- Architectural insights without discovery overhead
- Ready-to-use implementation guidance

### Core Architecture Changes

**Enhanced Existing Structure**:
```
cli/
├── gsum.js                  # Enhanced with Claude optimizations
├── lib/
│   ├── analyzer.js          # Enhanced with import graph analysis
│   ├── generator.js         # Add Claude-optimized output formats
│   ├── gemini.js           # Add context-specific prompts
│   ├── smart-files.js      # Improve ranking algorithms
│   ├── cache-manager.js    # NEW: Smart caching system
│   └── claude-optimizer.js # NEW: Token optimization logic
```

**Cache Structure**:
```
.gsum/
├── context.md              # Claude-optimized context cache
├── context-{task-hash}.md  # Task-specific contexts  
├── file-rankings.json      # Smart file importance scores
├── cache-metadata.json     # Invalidation tracking
└── analyzer-cache.json     # Cache expensive analysis results
```

### The Gemini Optimization Prompts

Different prompts for each command to maximize value:

**For `gsum` (ephemeral context)**:
```
GOAL: Create a 3,000-token context package for immediate Claude Code productivity.

Focus on:
1. The 10 most important files with their key functions
2. Common patterns and conventions
3. Quick-reference for adding features
4. File paths with line numbers for navigation

OUTPUT: Actionable context, not documentation
```

**For `gsum save` (comprehensive + cache)**:
```
GOAL: Create comprehensive documentation AND a Claude-optimized context cache.

Part 1: Full architectural documentation (existing behavior)
Part 2: Extract 4,000-token Claude context focusing on:
- Most frequently modified files
- Core architectural decisions
- Implementation patterns
- Directory structure guide

OUTPUT: Two versions - human docs and Claude cache
```

**For `gsum plan <task>` (task-specific)**:
```
GOAL: Create implementation plan for: [TASK]

Include:
1. The 5-10 most relevant files for this task
2. Specific code snippets to reference/modify
3. Step-by-step implementation with exact paths
4. Common patterns from similar features

OUTPUT: Actionable plan with embedded context
```

### Smart Caching & Incremental Updates

**Intelligent Multi-Factor Update Decision**:
```javascript
// Analyze change impact, not just line count
const changes = await git.getDetailedChanges(lastHash, currentHash);
const impact = {
  fileCount: changes.files.length,
  totalLines: changes.totalLines,
  hasApiChanges: changes.files.some(f => f.path.includes('/api/')),
  hasDepChanges: changes.files.includes('package.json'),
  hasConfigChanges: changes.files.some(f => isConfigFile(f.path)),
  hasMultipleModules: countAffectedModules(changes.files) > 2,
  maxLinesInOneFile: Math.max(...changes.files.map(f => f.lines))
};

// Smart decision based on change patterns
if (shouldFullRegenerate(impact)) {
  return await generateFullContext();
} else if (shouldPartialUpdate(impact)) {
  return await updateAffectedSections(changes);
} else {
  return await updateContextIncrementally(changes);
}
```

**Update Decision Logic**:
```javascript
function shouldFullRegenerate(impact) {
  return (
    // Multi-file changes with significant lines
    (impact.fileCount > 5 && impact.totalLines > 200) ||
    // API contract changes
    (impact.hasApiChanges && impact.fileCount > 2) ||
    // Dependency changes
    impact.hasDepChanges ||
    // Cross-module refactoring
    (impact.hasMultipleModules && impact.totalLines > 100) ||
    // Major single-file rewrite (rare but important)
    impact.maxLinesInOneFile > 1000
  );
}

function shouldPartialUpdate(impact) {
  return (
    // Multiple files but focused changes
    (impact.fileCount > 1 && impact.fileCount <= 5) ||
    // Single large file change
    (impact.fileCount === 1 && impact.maxLinesInOneFile > 200) ||
    // Config changes that affect architecture
    impact.hasConfigChanges
  );
}
// Otherwise: micro-update
```

**What Gets Tracked**:
- Number of files changed and their paths
- Change concentration (many small vs few large changes)
- Type of files (API, config, tests, components)
- Module boundaries crossed
- Import/export signature changes
- New/deleted files vs modifications

**Incremental Update Strategy**:
1. **Micro-updates** (Single file or minimal multi-file changes):
   - Update only specific file summaries
   - Add "Recent changes" note
   - No Gemini call needed
   
2. **Partial updates** (Focused multi-file or architectural changes):
   - Re-analyze changed files + direct dependencies
   - Update affected architectural sections
   - Quick Gemini call for affected module only

3. **Full regeneration** (Cross-cutting changes or dependencies):
   - Complete re-analysis
   - Full Gemini context generation
   - New baseline for future updates

**Cache Structure Enhanced**:
```
.gsum/
├── context.md              # Current Claude context
├── context-base.md         # Last full analysis baseline
├── context-diffs/          # Incremental changes
│   ├── {hash}.json        # Change details per commit
│   └── accumulated.json   # Accumulated changes since baseline
├── file-summaries/         # Individual file analysis cache
│   └── {file-hash}.json   # Cached analysis per file
└── cache-metadata.json     # Tracking and invalidation data
```

**Example Incremental Update**:
```markdown
## RECENT CHANGES (since last full analysis)

### Modified Files
- `src/api/auth.js:45-67` - Added JWT refresh logic
- `src/components/Login.tsx:23-45` - Updated to use new auth flow

### New Dependencies
- `jsonwebtoken@9.0.0` - Added for JWT handling

### Architecture Impact
- Auth flow now supports token refresh
- Consider updating tests in `src/api/auth.test.js`
```

### Token Optimization Techniques

**Information Density Maximization**:
- Code snippets over prose descriptions
- Bullet points over paragraphs  
- File paths with line numbers for easy navigation
- Architectural diagrams as ASCII art
- Function signatures over full implementations

**Claude-Optimized Formatting**:
```markdown
## CRITICAL FILES

### src/auth/middleware.js:45-67
Authentication middleware - handles JWT validation
```javascript
// Key function that Claude will need
export const validateToken = (req, res, next) => {
  // Core logic here
}
```

### src/api/users.js:23-89
User CRUD operations - follows REST pattern
- getUserById(id) - line 23
- createUser(userData) - line 45  
- updateUser(id, updates) - line 67
```

## Success Metrics

**Context Quality**:
- Claude completes tasks without asking "which files should I look at?"
- 90%+ relevant file selection accuracy
- Zero timeout issues during Claude Code sessions

**Efficiency Gains**:
- Context preparation: <60 seconds for any codebase
- Context consumption: <5 seconds in Claude Code
- Token usage: 80% reduction in discovery overhead

**User Experience**:
- Single `gsum prepare` command provides everything Claude needs
- Context stays relevant across multiple Claude sessions
- Smart cache prevents redundant analysis

## Implementation Details

### File-by-File Changes

**Create New**:
```
cli/lib/cache-manager.js     # Smart caching with git integration
cli/lib/claude-optimizer.js  # Token optimization for Claude consumption
```

**Modify Existing**:
```
cli/lib/generator.js         # Add Claude-optimized output generation
cli/lib/analyzer.js          # Add import graph analysis
cli/lib/smart-files.js       # Improve ranking algorithms
cli/lib/gemini.js           # Add context-specific prompts
cli/gsum.js                 # Add --claude-optimized flag
```

### Key Implementation Decisions

**Gemini Prompt Optimization**:
Instead of general documentation, Gemini gets specialized prompts for:
- File importance ranking (using git history + import analysis)
- Code pattern recognition (architectural decisions)
- Token-efficient summarization (Claude-optimized format)
- Task-specific filtering (auth vs API vs frontend focus)

**Local Analysis Enhancement**:
Leverage existing `cli/lib/analyzer.js:69-73` but add:
- Import graph analysis for file centrality scoring
- Git blame data for identifying active/stable code areas  
- Package.json parsing for framework-specific optimizations
- File complexity scoring (lines, functions, dependencies)

**Cache Intelligence**:
- Hash-based invalidation using existing `cli/lib/git.js:57`
- Partial updates instead of full regeneration
- Task-context separation (auth context vs general context)
- File ranking persistence across cache rebuilds

### Immediate Implementation Priority

1. **Enhance `gsum` command** - Add Claude optimization and better caching
2. **Enhance `gsum save`** - Generate both human docs + Claude context cache
3. **Smart caching system** - Prevent redundant Gemini calls
4. **Improve analyzer** - Add import graph analysis for better file ranking

### The Claude Code Integration

**Detection**: Use existing `cli/lib/generator.js:24-28` Claude Code detection

**Optimization**: When Claude Code detected:
- Automatically run `gsum prepare` if cache is stale
- Format output with file paths and line numbers for easy navigation
- Prioritize actionable information over descriptive content
- Include specific commands and file paths Claude can act on immediately

### Example Output Format

**Current gsum output** (verbose, hard to parse):
```
This project uses React with TypeScript and follows a modular architecture...
```

**New gsum context output** (actionable, Claude-optimized):
```markdown
## ARCHITECTURE: React/TypeScript SPA

## KEY FILES FOR DEVELOPMENT
- `src/components/Auth/LoginForm.tsx:23-67` - Main auth component
- `src/api/auth.ts:12-45` - Auth API calls  
- `src/stores/authStore.ts` - Zustand auth state
- `src/types/auth.ts` - Auth type definitions

## COMMON PATTERNS
- Components: Use custom hooks from `src/hooks/`
- API: Axios client in `src/api/client.ts` 
- State: Zustand stores in `src/stores/`
- Routing: React Router in `src/routes/`

## TO ADD AUTH FEATURE
1. Create component in `src/components/Auth/`
2. Add API call to `src/api/auth.ts`
3. Update auth store in `src/stores/authStore.ts`
4. Add types to `src/types/auth.ts`
```

This gives Claude everything needed to be immediately productive without any discovery overhead.