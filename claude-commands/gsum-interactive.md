---
description: Interactive guided mode for generating AI-powered codebase summaries. Walks you through configuring context levels, focus areas, and analysis depth, then generates comprehensive documentation using Claude's intelligence. Works in any repository without external dependencies.
allowed-tools: [bash, Read, Edit, MultiEdit, Write, Grep, Glob, LS, TodoWrite]
---

# Gsum Interactive Command

**WORKFLOW PHASES:** ANALYZE → CONFIG1 → CONFIG2 → CONFIG3 → GENERATE → CONFIRM → EXECUTE

You MUST follow workflow phases in order and STOP at each user interaction point.

## ANALYZE Phase

Start immediately with project analysis:

1. Run project fingerprint analysis
2. Display results to user
3. Transition to CONFIG1 phase

**Execute these commands:**

!bash pwd && echo "=== $(basename $(pwd)) Repository ==="
!LS .
!Read package.json
!Glob "*.md"
!bash find . -name "*.js" -o -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.java" -o -name "*.rs" -o -name "*.swift" | head -20
!bash git log --oneline -10 2>/dev/null || echo "No git history available"

After analysis completes, proceed to CONFIG1 phase.

## CONFIG1 Phase - Summary Type

Ask user about summary type configuration.

You MUST:
1. Ask ONLY the summary type question
2. Wait for user response
3. Do NOT proceed to CONFIG2 until user responds

**Question 1: Summary Type**

Choose your preferred output method:
- **A) Ephemeral** 📄 - Display results in chat
- **B) Persistent** 💾 - Save to ARCHITECTURE.gsum.md file

**Your choice (A or B):**

**STOP:** Wait for user response before proceeding to CONFIG2.

## CONFIG2 Phase - Detail Level

You MUST:
1. Only enter this phase after user responds to CONFIG1
2. Ask ONLY the detail level question
3. Wait for user response
4. Do NOT proceed to CONFIG3 until user responds

**Question 2: Detail Level**

Choose analysis depth:
- **A) All Detail Levels** 🌟 - Maximum comprehensive analysis
- **B) Minimal** ⚡ - Essential architecture and key patterns (--context-level minimal)
- **C) Standard** ⚖️ - Balanced detail for development work (--context-level standard)
- **D) Comprehensive** 📚 - Full documentation with examples (--context-level comprehensive)

**Your choice (A, B, C, or D):**

**STOP:** Wait for user response before proceeding to CONFIG3.

## CONFIG3 Phase - Focus Areas

You MUST:
1. Only enter this phase after user responds to CONFIG2
2. Ask ONLY the focus areas question
3. Wait for user response
4. Do NOT proceed to GENERATE until user responds

**Question 3: Focus Areas**

Choose analysis focus:
- **A) All Areas** 🌟 - Complete comprehensive analysis (no --focus flag)
- **B) Frontend** 🎨 - UI, components, styling (--focus frontend)
- **C) API** 🔧 - Backend endpoints, services (--focus api)
- **D) Database** 🗄️ - Models, schemas (--focus database)
- **E) Authentication** 🔐 - Security, auth (--focus authentication)
- **F) Performance** ⚡ - Optimization, monitoring (--focus performance)
- **G) Testing** 🧪 - Test structure, coverage (--focus testing)
- **H) Infrastructure** 🏗️ - Deployment, CI/CD (--focus infrastructure)

**Your choice (A for all areas, or specific letters like B,C,F):**

**STOP:** Wait for user response before proceeding to GENERATE.

## GENERATE Phase - Command Construction

You MUST:
1. Only enter this phase after user responds to CONFIG3
2. Build gsum command based on user responses
3. Show command and explanation to user
4. Proceed to CONFIRM phase

Build the gsum command using this mapping:

**Summary Type:**
- A = `gsum` (ephemeral)
- B = `gsum save` (persistent)

**Detail Level:**
- A = no --context-level flag (all levels)
- B = `--context-level minimal`
- C = `--context-level standard`
- D = `--context-level comprehensive`

**Focus Areas:**
- A = no --focus flag (all areas)
- Single letter = `--focus [area]`
- Multiple letters = `--focus [area1,area2,area3]`

**Generated Command:**
```bash
[constructed-gsum-command]
```

**This command will:**
- [Explain what the command does based on user choices]
- [Output location and format]
- [Estimated processing time]

Proceed to CONFIRM phase.

## CONFIRM Phase - User Approval

You MUST:
1. Ask user to confirm the generated command
2. Wait for Y/N response
3. Only proceed to EXECUTE if user confirms with Y

**Confirm execution of this command?**

**Your choice (Y/N):**

**STOP:** Wait for user confirmation before proceeding to EXECUTE.

## EXECUTE Phase - Run Command

You MUST:
1. Only enter this phase if user confirmed with Y in CONFIRM phase
2. Execute the exact command generated in GENERATE phase
3. Display results to user

!bash [exact-generated-gsum-command]

**Analysis complete!** The gsum command has been executed successfully.