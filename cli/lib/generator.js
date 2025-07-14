const fs = require('fs').promises;
const path = require('path');
const { ProjectAnalyzer } = require('./analyzer');
const { GitIntegration } = require('./git');
const { GeminiClient } = require('./gemini');
const { ClaudeClient } = require('./claude');
const { generateFallbackPrompt } = require('./fallback');
const { SmartFileSelector } = require('./smart-files');

class SummaryGenerator {
  constructor(options = {}) {
    this.options = options;
    this.analyzer = new ProjectAnalyzer(options);
    this.gemini = new GeminiClient();
    this.claude = new ClaudeClient();
  }

  async generate(targetDir, options = {}) {
    const mode = options.mode || 'ephemeral';
    const outputFile = this.determineOutputFile(mode, options);
    const fullOutputPath = path.join(targetDir, outputFile);
    
    // Auto-enable verbose mode when running through Claude Code
    const isClaudeCode = process.env.CLAUDE_CODE || process.env.CLAUDE_DESKTOP_TOOLS_ACTIVE;
    if (isClaudeCode) {
      global.verbose = true;
      global.log('🤖 Detected Claude Code environment - enabling verbose mode', 'info');
    }
    
    // Determine context level
    let contextLevel = options.contextLevel;
    if (!contextLevel) {
      if (mode === 'ephemeral' && isClaudeCode) {
        // Use minimal for ephemeral in Claude Code to avoid 2-minute timeout
        contextLevel = 'minimal';
        global.log('📉 Using minimal context level for Claude Code (faster generation)', 'info');
      } else if (mode === 'save') {
        contextLevel = 'comprehensive';
      } else {
        contextLevel = 'standard';
      }
    }
    
    // Log focus area if specified
    if (options.focus && global.verbose) {
      global.log(`Focusing on ${options.focus} area`, 'verbose');
    }

    if (global.verbose) {
      global.log(`📋 Generating ${mode} summary for ${targetDir}`, 'info');
      global.log(`📊 Context level: ${contextLevel}`, 'verbose');
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
    if (global.verbose) {
      global.log('🔍 Analyzing project structure...', 'info');
    }
    const projectInfo = await this.analyzer.analyze(targetDir);
    
    if (global.verbose) {
      global.log(`✅ Analysis complete: ${projectInfo.fileCount} files, ${projectInfo.techStack.join(', ')}`, 'info');
    }
    
    // Smart file selection if requested
    if (options.smartFiles) {
      if (global.verbose) {
        global.log(`🧠 Selecting ${options.smartFiles} most relevant files...`, 'info');
      }
      
      const selector = new SmartFileSelector({
        smartFiles: options.smartFiles,
        projectPath: targetDir
      });
      
      const selectedFiles = await selector.selectFiles(projectInfo);
      const fileContents = await selector.getFileContents(selectedFiles);
      
      projectInfo.smartFiles = {
        selected: selectedFiles,
        contents: fileContents
      };
      
      if (global.verbose) {
        global.log(`✅ Smart file selection included ${selectedFiles.length} files`, 'info');
      }
    }

    // Generate the summary
    let summary;
    try {
      if (options.claudeOnly) {
        if (global.verbose) {
          global.log('🤖 Using Claude-only mode (no external API calls)', 'info');
        }
        summary = await this.generateWithClaude(projectInfo, mode, contextLevel);
      } else {
        summary = await this.generateWithGemini(projectInfo, mode, contextLevel);
      }
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
      // Print the file content and delete it
      console.log(summary);
      await fs.unlink(fullOutputPath);
      return summary;
    } else if (mode === 'save') {
      console.log(`✅ Summary saved to ${outputFile}`);
      
      // Add git hash if in a git repo
      const git = new GitIntegration(targetDir);
      const currentHash = git.getCurrentHash();
      if (currentHash) {
        await git.addHashToFile(fullOutputPath, currentHash);
      }
      
      return fullOutputPath;
    } else if (mode === 'plan') {
      // For plan mode, also print and delete
      console.log(summary);
      await fs.unlink(fullOutputPath);
      return summary;
    }
  }

  async generateWithGemini(projectInfo, mode, contextLevel) {
    const outputFile = this.determineOutputFile(mode, this.options);
    
    const prompt = this.buildPrompt(projectInfo, mode, contextLevel, outputFile);
    
    if (global.debug) {
      global.log('Calling Gemini API...', 'debug');
    }

    // Gemini will write to the file (or return content)
    const content = await this.gemini.generate(prompt, projectInfo.path, outputFile);
    
    if (!content) {
      throw new Error('Gemini failed to generate content');
    }

    // Content is already in the file, just return it
    return content;
  }

  buildPrompt(projectInfo, mode, contextLevel = 'standard', outputFile = null) {
    if (mode === 'plan') {
      return this.buildPlanPrompt(projectInfo);
    }
    
    // Pass context level, focus area, and output file to the prompt builder
    return this.buildSummaryPrompt(projectInfo, contextLevel, outputFile);
  }
  
  buildSummaryPrompt(projectInfo, contextLevel, outputFile) {
    // Define sections based on context level
    const sections = this.getSectionsForLevel(contextLevel);
    const targetWords = this.getTargetWordsForLevel(contextLevel);
    const focusArea = this.options.focus;
    
    // Adjust sections for focus area
    const filteredSections = focusArea ? this.filterSectionsForFocus(sections, focusArea) : sections;
    
    return `You are a senior software engineer, architect, and tech lead.
- You are an expert in the field of software engineering and architecture.
- You are also a great communicator and writer.
- You output extremely detailed and comprehensive documentation.
- You care about code quality, best practices, and teaching others.
- You always want to produce COMPLETE and COMPREHENSIVE documentation.

Your task is to create a comprehensive ARCHITECTURE & TECHNICAL SPECIFICATION document for this codebase${focusArea ? `, focusing specifically on the ${focusArea.toUpperCase()} aspects` : ''}.

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

${this.buildSectionPrompt(filteredSections)}

Context Level: ${contextLevel.toUpperCase()}
Target Length: ${targetWords}

${projectInfo.smartFiles ? this.buildSmartFilesSection(projectInfo.smartFiles) : ''}

IMPORTANT: A file named "${outputFile}" has been created in the current directory for you to write to.

Instructions:
1. Write your documentation to the existing file: ${outputFile}
2. Write ONLY the markdown content to this file - no thinking process, no preamble
3. The file should contain a ${contextLevel === 'minimal' ? 'concise' : contextLevel === 'standard' ? 'balanced' : 'comprehensive'} technical specification (aim for ${targetWords})
4. ${contextLevel !== 'minimal' ? 'Include actual code examples from the project where relevant' : 'Include only essential code examples'}
5. ${contextLevel === 'comprehensive' ? 'Be thorough but focused' : 'Focus on the most important aspects'}
6. Provide accurate, fact-checked information

DO NOT output the content to stdout. Write it directly to the file: ${outputFile}

IMPORTANT FALLBACK: If you cannot write to the file, then output the content to stdout with the following format:
--- BEGIN GSUM OUTPUT ---
[Your complete markdown documentation here]
--- END GSUM OUTPUT ---

REMEMBER: This is optimized for ${contextLevel === 'minimal' ? 'quick context with minimal tokens' : contextLevel === 'standard' ? 'balanced context for AI assistants' : 'complete documentation'}.`;
  }

  buildPlanPrompt(projectInfo) {
    const task = this.options.task || 'implement a new feature';
    const outputFile = 'GSUM_PLAN.md';
    
    return `You are a senior software engineer tasked with creating an implementation plan.

IMPORTANT: A file named "${outputFile}" has been created in the current directory for you to write to.

Project Information:
- Name: ${projectInfo.name}
- Tech Stack: ${projectInfo.techStack.join(', ')}
- Architecture: ${projectInfo.architecture}

Task: ${task}

${projectInfo.smartFiles ? `The following files have been identified as most relevant to this task:\n${projectInfo.smartFiles.selected.join('\n')}\n` : ''}

Instructions:
1. Write to the existing file at path: ${outputFile}
2. Write ONLY the implementation plan to this file
3. The plan should include:
   - Overview of the approach
   - Step-by-step implementation guide with clear, actionable tasks
   - Files that need to be modified or created (with exact paths)
   - Code examples for key changes
   - Testing approach and test cases
   - Potential challenges and solutions
   - Verification steps to ensure correctness

DO NOT output the content to stdout. Write it directly to the file: ${outputFile}

IMPORTANT FALLBACK: If you cannot write to the file, then output the content to stdout with the following format:
--- BEGIN GSUM OUTPUT ---
[Your complete implementation plan here]
--- END GSUM OUTPUT ---

IMPORTANT: 
- Make the plan clear, thoughtful, and fact-checked
- Each step should be actionable and verifiable
- Include specific commands, file paths, and code snippets
- Consider edge cases and error handling
- Ensure the plan is complete and can be followed step-by-step`;
  }
  
  getSectionsForLevel(contextLevel) {
    const allSections = [
      'PROJECT OVERVIEW',
      'SETUP & GETTING STARTED',
      'ARCHITECTURE OVERVIEW',
      'PROJECT STRUCTURE',
      'KEY MODULES & COMPONENTS',
      'DATABASE & DATA MODELS',
      'API DESIGN',
      'FRONTEND ARCHITECTURE',
      'BUSINESS LOGIC',
      'TESTING STRATEGY',
      'DEPLOYMENT & CONFIGURATION',
      'DEVELOPMENT WORKFLOW',
      'SECURITY CONSIDERATIONS',
      'PERFORMANCE OPTIMIZATIONS',
      'IMPORTANT PATTERNS & CONVENTIONS',
      'CURRENT LIMITATIONS & TECH DEBT',
      'INTEGRATION POINTS',
      'ADDING NEW FEATURES'
    ];
    
    switch (contextLevel) {
      case 'minimal':
        return [
          'PROJECT OVERVIEW',
          'ARCHITECTURE OVERVIEW',
          'PROJECT STRUCTURE',
          'KEY MODULES & COMPONENTS',
          'SETUP & GETTING STARTED'
        ];
      case 'standard':
        return [
          'PROJECT OVERVIEW',
          'ARCHITECTURE OVERVIEW',
          'PROJECT STRUCTURE',
          'KEY MODULES & COMPONENTS',
          'API DESIGN',
          'FRONTEND ARCHITECTURE',
          'BUSINESS LOGIC',
          'TESTING STRATEGY',
          'DEVELOPMENT WORKFLOW',
          'IMPORTANT PATTERNS & CONVENTIONS'
        ];
      case 'comprehensive':
      default:
        return allSections;
    }
  }
  
  getTargetWordsForLevel(contextLevel) {
    switch (contextLevel) {
      case 'minimal':
        return '1,000-2,000 words';
      case 'standard':
        return '3,000-4,000 words';
      case 'comprehensive':
      default:
        return '5,000-7,000 words';
    }
  }
  
  filterSectionsForFocus(sections, focusArea) {
    const focusSections = {
      frontend: [
        'PROJECT OVERVIEW',
        'FRONTEND ARCHITECTURE',
        'PROJECT STRUCTURE',
        'KEY MODULES & COMPONENTS',
        'IMPORTANT PATTERNS & CONVENTIONS',
        'SETUP & GETTING STARTED',
        'ADDING NEW FEATURES'
      ],
      api: [
        'PROJECT OVERVIEW',
        'API DESIGN',
        'ARCHITECTURE OVERVIEW',
        'PROJECT STRUCTURE',
        'BUSINESS LOGIC',
        'DATABASE & DATA MODELS',
        'SECURITY CONSIDERATIONS',
        'TESTING STRATEGY'
      ],
      database: [
        'PROJECT OVERVIEW',
        'DATABASE & DATA MODELS',
        'ARCHITECTURE OVERVIEW',
        'BUSINESS LOGIC',
        'PERFORMANCE OPTIMIZATIONS',
        'SECURITY CONSIDERATIONS'
      ],
      testing: [
        'PROJECT OVERVIEW',
        'TESTING STRATEGY',
        'PROJECT STRUCTURE',
        'DEVELOPMENT WORKFLOW',
        'SETUP & GETTING STARTED'
      ],
      deployment: [
        'PROJECT OVERVIEW',
        'DEPLOYMENT & CONFIGURATION',
        'ARCHITECTURE OVERVIEW',
        'SECURITY CONSIDERATIONS',
        'PERFORMANCE OPTIMIZATIONS',
        'DEVELOPMENT WORKFLOW'
      ],
      tooling: [
        'PROJECT OVERVIEW',
        'PROJECT STRUCTURE',
        'DEVELOPMENT WORKFLOW',
        'SETUP & GETTING STARTED',
        'IMPORTANT PATTERNS & CONVENTIONS'
      ],
      documentation: [
        'PROJECT OVERVIEW',
        'SETUP & GETTING STARTED',
        'ARCHITECTURE OVERVIEW',
        'API DESIGN',
        'DEVELOPMENT WORKFLOW',
        'ADDING NEW FEATURES'
      ]
    };
    
    const focusedList = focusSections[focusArea] || sections;
    return sections.filter(section => focusedList.includes(section));
  }
  
  buildSectionPrompt(sections) {
    return 'The document should include these sections:\n\n' + 
      sections.map(section => {
        const descriptions = {
          'PROJECT OVERVIEW': 'A comprehensive introduction explaining what this project does, its purpose, target users, and key value propositions.',
          'SETUP & GETTING STARTED': 'Step-by-step instructions for developers to get the project running locally, including prerequisites, installation, and common issues.',
          'ARCHITECTURE OVERVIEW': 'High-level architectural decisions, patterns used, and system design philosophy.',
          'PROJECT STRUCTURE': 'Detailed explanation of the directory structure and organization principles.',
          'KEY MODULES & COMPONENTS': 'In-depth analysis of core modules, their responsibilities, and interactions.',
          'DATABASE & DATA MODELS': 'Schema design, relationships, and data flow (if applicable).',
          'API DESIGN': 'Endpoints, request/response formats, authentication, and API conventions (if applicable).',
          'FRONTEND ARCHITECTURE': 'Component hierarchy, state management, routing, and UI patterns (if applicable).',
          'BUSINESS LOGIC': 'Core algorithms, business rules, and domain logic implementation.',
          'TESTING STRATEGY': 'Testing approach, tools used, and how to write/run tests.',
          'DEPLOYMENT & CONFIGURATION': 'Deployment process, environment variables, and configuration management.',
          'DEVELOPMENT WORKFLOW': 'Git workflow, code review process, and development best practices.',
          'SECURITY CONSIDERATIONS': 'Security measures, authentication/authorization, and potential vulnerabilities.',
          'PERFORMANCE OPTIMIZATIONS': 'Performance considerations, caching strategies, and optimization techniques.',
          'IMPORTANT PATTERNS & CONVENTIONS': 'Coding standards, naming conventions, and architectural patterns used.',
          'CURRENT LIMITATIONS & TECH DEBT': 'Known issues, technical debt, and areas for improvement.',
          'INTEGRATION POINTS': 'External services, APIs, and third-party integrations.',
          'ADDING NEW FEATURES': 'Step-by-step guide for common development tasks and feature additions.'
        };
        
        return `# ${section}\n${descriptions[section] || ''}`;
      }).join('\n\n');
  }
  
  buildSmartFilesSection(smartFiles) {
    let section = '\n## MOST RELEVANT FILES\n\n';
    section += 'Based on git history, import frequency, and file importance, here are the most relevant files:\n\n';
    
    for (const file of smartFiles.contents) {
      section += `### ${file.path}\n`;
      if (file.truncated) {
        section += `(Showing first 50 of ${file.totalLines} lines)\n`;
      }
      section += '```\n';
      section += file.content;
      section += '\n```\n\n';
    }
    
    return section;
  }
  
  determineOutputFile(mode, options) {
    if (options.file) {
      return options.file;
    }
    
    const timestamp = Date.now();
    switch (mode) {
      case 'plan':
        return `.gsum_plan_${timestamp}.md`;
      case 'ephemeral':
        return `.gsum_temp_${timestamp}.md`;
      case 'save':
      default:
        return 'ARCHITECTURE.gsum.md';
    }
  }
  
  async generateWithClaude(projectInfo, mode, contextLevel) {
    const outputFile = this.determineOutputFile(mode, this.options);
    const prompt = this.buildClaudePrompt(projectInfo, mode, contextLevel);
    
    if (global.debug) {
      global.log('Generating summary directly (Claude-only mode)...', 'debug');
    }
    
    // Output the analysis for Claude to process
    console.log('\n📋 Project Analysis Complete!');
    console.log(`📊 ${projectInfo.fileCount} files analyzed`);
    console.log(`🔧 Tech Stack: ${projectInfo.techStack.join(', ')}`);
    console.log(`📐 Context Level: ${contextLevel}`);
    console.log(`\n--- PROJECT ANALYSIS ---\n`);
    console.log(prompt);
    console.log('\n--- END ANALYSIS ---\n');
    
    const fullPath = path.join(projectInfo.path, outputFile);
    console.log(`🤖 Claude: Please generate the ${mode === 'plan' ? 'implementation plan' : 'architecture summary'} and save it to: ${outputFile}`);
    
    // Return instructions for what Claude should do
    const instructions = `Please create a ${mode === 'plan' ? 'detailed implementation plan' : `comprehensive ${contextLevel} architecture summary`} based on the analysis above and save it to the file: ${outputFile}\n\nThe file should contain the complete ${mode === 'plan' ? 'plan' : 'summary'}, not just analysis data.`;
    
    return instructions;
  }
  
  buildClaudePrompt(projectInfo, mode, contextLevel) {
    // For Claude-only mode, we output the project info in a structured way
    let prompt = `Project: ${projectInfo.name}\n`;
    prompt += `Path: ${projectInfo.path}\n`;
    prompt += `Tech Stack: ${projectInfo.techStack.join(', ')}\n`;
    prompt += `Architecture: ${projectInfo.architecture}\n`;
    prompt += `Total Files: ${projectInfo.fileCount}\n`;
    
    if (projectInfo.packageInfo) {
      prompt += `\nPackage Info:\n`;
      prompt += `- Name: ${projectInfo.packageInfo.name}\n`;
      prompt += `- Version: ${projectInfo.packageInfo.version}\n`;
      if (projectInfo.packageInfo.dependencies || projectInfo.packageInfo.devDependencies) {
        const prodDeps = projectInfo.packageInfo.dependencies ? Object.keys(projectInfo.packageInfo.dependencies).length : 0;
        const devDeps = projectInfo.packageInfo.devDependencies ? Object.keys(projectInfo.packageInfo.devDependencies).length : 0;
        prompt += `- Dependencies: ${prodDeps} prod, ${devDeps} dev\n`;
      }
    }
    
    if (projectInfo.gitInfo) {
      prompt += `\nGit Info:\n`;
      prompt += `- Branch: ${projectInfo.gitInfo.branch}\n`;
      prompt += `- Remote: ${projectInfo.gitInfo.remote}\n`;
    }
    
    // Project structure info
    if (projectInfo.structure && Object.keys(projectInfo.structure).length > 0) {
      prompt += `\nProject Structure:\n`;
      Object.keys(projectInfo.structure).slice(0, 10).forEach(key => {
        const item = projectInfo.structure[key];
        const type = item && item.type ? item.type : (key.includes('.') ? 'file' : 'directory');
        prompt += `- ${key} (${type})\n`;
      });
      if (Object.keys(projectInfo.structure).length > 10) {
        prompt += `... and ${Object.keys(projectInfo.structure).length - 10} more items\n`;
      }
    }
    
    // Key imports/dependencies if available
    if (projectInfo.imports && Object.keys(projectInfo.imports).length > 0) {
      prompt += `\nKey Import Patterns:\n`;
      const importCounts = {};
      Object.values(projectInfo.imports).forEach(imports => {
        imports.forEach(imp => {
          if (!imp.startsWith('.')) { // External imports
            importCounts[imp] = (importCounts[imp] || 0) + 1;
          }
        });
      });
      const topImports = Object.entries(importCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8);
      topImports.forEach(([imp, count]) => {
        prompt += `- ${imp}: used ${count} times\n`;
      });
    }
    
    if (projectInfo.smartFiles && projectInfo.smartFiles.contents) {
      prompt += `\nKey Files (based on importance):\n`;
      projectInfo.smartFiles.contents.forEach(file => {
        prompt += `\n### ${file.path}\n`;
        prompt += '```\n';
        prompt += file.content;
        prompt += '\n```\n';
      });
    }
    
    // Add task-specific instructions
    if (mode === 'plan') {
      prompt += `\n\nTask: ${this.options.task}\n`;
      prompt += `\nPlease create a detailed implementation plan with:\n`;
      prompt += `- Step-by-step approach\n`;
      prompt += `- Files to modify/create\n`;
      prompt += `- Code examples\n`;
      prompt += `- Testing strategy\n`;
    } else {
      const sections = this.getSectionsForLevel(contextLevel);
      prompt += `\n\nPlease create a ${contextLevel} architecture summary (${this.getTargetWordsForLevel(contextLevel)}) with these sections:\n`;
      sections.forEach(section => {
        prompt += `- ${section}\n`;
      });
      prompt += `\nFocus on the actual codebase structure, key modules, and how they work together.`;
    }
    
    return prompt;
  }
}

module.exports = { SummaryGenerator };