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
    const outputFile = options.file || 'ARCHITECTURE.gsum.md';
    const fullOutputPath = path.join(targetDir, outputFile);
    
    // Determine context level
    const contextLevel = options.contextLevel || 
      (mode === 'save' ? 'comprehensive' : 'standard');
    
    // Log focus area if specified
    if (options.focus && global.verbose) {
      global.log(`Focusing on ${options.focus} area`, 'verbose');
    }

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
    
    // Smart file selection if requested
    if (options.smartFiles) {
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
        global.log(`Smart file selection included ${selectedFiles.length} files`, 'verbose');
      }
    }

    // Generate the summary
    let summary;
    try {
      summary = await this.generateWithGemini(projectInfo, mode, contextLevel);
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

  async generateWithGemini(projectInfo, mode, contextLevel) {
    const prompt = this.buildPrompt(projectInfo, mode, contextLevel);
    
    if (global.debug) {
      global.log('Calling Gemini API...', 'debug');
    }

    const result = await this.gemini.generate(prompt, projectInfo.path);
    
    if (!result || result.trim() === '') {
      throw new Error('Empty response from Gemini');
    }

    return result;
  }

  buildPrompt(projectInfo, mode, contextLevel = 'standard') {
    if (mode === 'plan') {
      return this.buildPlanPrompt(projectInfo);
    }
    
    // Pass context level and focus area to the prompt builder
    return this.buildSummaryPrompt(projectInfo, contextLevel);
  }
  
  buildSummaryPrompt(projectInfo, contextLevel) {
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

Based on the project information above, create this architecture-focused technical specification. Make sure to:
1. Create a ${contextLevel === 'minimal' ? 'concise' : contextLevel === 'standard' ? 'balanced' : 'comprehensive'} document - aim for ${targetWords}
2. ${contextLevel !== 'minimal' ? 'Include actual code examples from the project where relevant' : 'Include only essential code examples'}
3. ${contextLevel === 'comprehensive' ? 'Be exhaustive in documenting every aspect' : 'Focus on the most important aspects'}
4. Provide accurate, fact-checked information

REMEMBER: This is optimized for ${contextLevel === 'minimal' ? 'quick context with minimal tokens' : contextLevel === 'standard' ? 'balanced context for AI assistants' : 'complete documentation'}.`;
  }

  buildPlanPrompt(projectInfo) {
    const task = this.options.task || 'implement a new feature';
    
    return `You are a senior software engineer tasked with creating an implementation plan.

Project Information:
- Name: ${projectInfo.name}
- Tech Stack: ${projectInfo.techStack.join(', ')}
- Architecture: ${projectInfo.architecture}

Task: ${task}

${projectInfo.smartFiles ? `The following files have been identified as most relevant to this task:\n${projectInfo.smartFiles.selected.join('\n')}\n` : ''}

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
        return '2,000-3,000 words';
      case 'standard':
        return '5,000-7,000 words';
      case 'comprehensive':
      default:
        return '10,000+ words';
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
}

module.exports = { SummaryGenerator };