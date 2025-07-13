const fs = require('fs').promises;
const path = require('path');
const { ProjectAnalyzer } = require('./analyzer');
const { GitIntegration } = require('./git');
const { GeminiClient } = require('./gemini');
const { ClaudeClient } = require('./claude');
const { generateFallbackPrompt } = require('./fallback');

class SummaryGenerator {
  constructor(options = {}) {
    this.options = options;
    this.analyzer = new ProjectAnalyzer(options);
    this.gemini = new GeminiClient();
    this.claude = new ClaudeClient();
  }

  async generate(targetDir, options = {}) {
    const mode = options.mode || 'ephemeral';
    const outputFile = options.file || 'ARCHITECTURE.gsum.md';
    const fullOutputPath = path.join(targetDir, outputFile);

    if (global.verbose) {
      global.log(`Generating ${mode} summary for ${targetDir}`, 'verbose');
    }

    // Check if we should regenerate (for save mode)
    if (mode === 'save' && !options.force) {
      const git = new GitIntegration(targetDir);
      const shouldRegen = await git.shouldRegenerate(fullOutputPath, options);
      
      if (!shouldRegen) {
        console.log('Summary is up to date. Use --force to regenerate.');
        return null;
      }
    }

    // Analyze the project
    const projectInfo = await this.analyzer.analyze(targetDir);

    // Generate the summary
    let summary;
    try {
      summary = await this.generateWithGemini(projectInfo, mode);
    } catch (error) {
      if (error.message.includes('quota exceeded')) {
        // Offer Claude fallback
        console.error('❌ ERROR: Gemini API quota exceeded');
        
        if (options.fallback) {
          console.error('\nGenerating Claude fallback prompt...\n');
          const fallbackPrompt = generateFallbackPrompt(projectInfo);
          console.log(fallbackPrompt);
          return null;
        } else if (options.claudeExecute && this.claude.checkClaudeInstalled()) {
          console.error('\nAttempting to use Claude CLI directly...\n');
          try {
            const claudePrompt = this.buildPrompt(projectInfo, mode);
            summary = await this.claude.executeWithClaude(claudePrompt, targetDir);
          } catch (claudeError) {
            console.error('Claude execution failed:', claudeError.message);
            console.error('\nUse --fallback to generate a prompt instead.\n');
            throw error;
          }
        } else {
          console.error('\nOptions:');
          console.error('1. Run: gsum --fallback (generates prompt to copy)');
          console.error('2. Run: gsum --claude-execute (tries Claude CLI directly)');
          console.error('3. Wait for Gemini quota reset\n');
        }
        
        throw error;
      }
      throw error;
    }

    // Handle output based on mode
    if (mode === 'ephemeral') {
      console.log(summary);
      return summary;
    } else if (mode === 'save') {
      await fs.writeFile(fullOutputPath, summary);
      console.log(`✅ Summary saved to ${outputFile}`);
      
      // Add git hash if in a git repo
      const git = new GitIntegration(targetDir);
      const currentHash = git.getCurrentHash();
      if (currentHash) {
        await git.addHashToFile(fullOutputPath, currentHash);
      }
      
      return fullOutputPath;
    } else if (mode === 'plan') {
      console.log(summary);
      return summary;
    }
  }

  async generateWithGemini(projectInfo, mode) {
    const prompt = this.buildPrompt(projectInfo, mode);
    
    if (global.debug) {
      global.log('Calling Gemini API...', 'debug');
    }

    const result = await this.gemini.generate(prompt, projectInfo.path);
    
    if (!result || result.trim() === '') {
      throw new Error('Empty response from Gemini');
    }

    return result;
  }

  buildPrompt(projectInfo, mode) {
    if (mode === 'plan') {
      return this.buildPlanPrompt(projectInfo);
    }

    // Default summary prompt
    return `You are a senior software engineer, architect, and tech lead.
- You are an expert in the field of software engineering and architecture.
- You are also a great communicator and writer.
- You output extremely detailed and comprehensive documentation.
- You care about code quality, best practices, and teaching others.
- You always want to produce COMPLETE and COMPREHENSIVE documentation.

Your task is to create a comprehensive ARCHITECTURE & TECHNICAL SPECIFICATION document for this codebase.

Project Information:
- Name: ${projectInfo.name}
- Path: ${projectInfo.path}
- Tech Stack: ${projectInfo.techStack.join(', ')}
- Architecture: ${projectInfo.architecture}
- File Count: ${projectInfo.fileCount}
${projectInfo.packageInfo ? `- Package: ${projectInfo.packageInfo.name} v${projectInfo.packageInfo.version}` : ''}
${projectInfo.gitInfo ? `- Git Branch: ${projectInfo.gitInfo.branch}` : ''}

The document should include these sections:

# PROJECT OVERVIEW
A comprehensive introduction explaining what this project does, its purpose, target users, and key value propositions.

# SETUP & GETTING STARTED
Step-by-step instructions for developers to get the project running locally, including prerequisites, installation, and common issues.

# ARCHITECTURE OVERVIEW
High-level architectural decisions, patterns used, and system design philosophy.

# PROJECT STRUCTURE
Detailed explanation of the directory structure and organization principles.

# KEY MODULES & COMPONENTS
In-depth analysis of core modules, their responsibilities, and interactions.

# DATABASE & DATA MODELS
Schema design, relationships, and data flow (if applicable).

# API DESIGN
Endpoints, request/response formats, authentication, and API conventions (if applicable).

# FRONTEND ARCHITECTURE
Component hierarchy, state management, routing, and UI patterns (if applicable).

# BUSINESS LOGIC
Core algorithms, business rules, and domain logic implementation.

# TESTING STRATEGY
Testing approach, tools used, and how to write/run tests.

# DEPLOYMENT & CONFIGURATION
Deployment process, environment variables, and configuration management.

# DEVELOPMENT WORKFLOW
Git workflow, code review process, and development best practices.

# SECURITY CONSIDERATIONS
Security measures, authentication/authorization, and potential vulnerabilities.

# PERFORMANCE OPTIMIZATIONS
Performance considerations, caching strategies, and optimization techniques.

# IMPORTANT PATTERNS & CONVENTIONS
Coding standards, naming conventions, and architectural patterns used.

# CURRENT LIMITATIONS & TECH DEBT
Known issues, technical debt, and areas for improvement.

# INTEGRATION POINTS
External services, APIs, and third-party integrations.

# ADDING NEW FEATURES
Step-by-step guide for common development tasks and feature additions.

Based on the project information above, create this architecture-focused technical specification. Make sure to:
1. Create an EXTREMELY detailed document - aim for 10,000+ words
2. Include actual code examples from the project where relevant
3. Be exhaustive in documenting every aspect
4. Provide accurate, fact-checked information

REMEMBER: This is meant to be the DEFINITIVE guide to understanding and working with this codebase. Don't hold back on details!`;
  }

  buildPlanPrompt(projectInfo) {
    const task = this.options.task || 'implement a new feature';
    
    return `You are a senior software engineer tasked with creating an implementation plan.

Project Information:
- Name: ${projectInfo.name}
- Tech Stack: ${projectInfo.techStack.join(', ')}
- Architecture: ${projectInfo.architecture}

Task: ${task}

Based on the codebase analysis, create a detailed implementation plan that includes:
1. Overview of the approach
2. Step-by-step implementation guide with clear, actionable tasks
3. Files that need to be modified or created (with exact paths)
4. Code examples for key changes
5. Testing approach and test cases
6. Potential challenges and solutions
7. Verification steps to ensure correctness

IMPORTANT: 
- Make the plan clear, thoughtful, and fact-checked
- Each step should be actionable and verifiable
- Include specific commands, file paths, and code snippets
- Consider edge cases and error handling
- Ensure the plan is complete and can be followed step-by-step`;
  }
}

module.exports = { SummaryGenerator };