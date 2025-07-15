const { GeminiClient } = require('./gemini');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ParallelGeminiClient {
  constructor() {
    this.baseClient = new GeminiClient();
  }

  async generateParallel(projectInfo, targetDir, outputFile) {
    if (global.verbose || global.debug) {
      global.log('🚀 Starting parallel Gemini processing...', 'info');
    }

    // Define processing chunks
    const chunks = this.defineProcessingChunks(projectInfo);
    
    try {
      // Execute all chunks in parallel
      const results = await Promise.all(
        chunks.map((chunk, index) => this.processChunk(chunk, index, targetDir))
      );

      // Aggregate results
      const aggregatedContent = this.aggregateResults(results, projectInfo);
      
      // Write final output
      const expectedFile = path.join(targetDir, outputFile);
      await fs.writeFile(expectedFile, aggregatedContent);
      
      if (global.verbose || global.debug) {
        global.log(`✅ Parallel processing complete, wrote ${aggregatedContent.length} chars to ${outputFile}`, 'info');
      }
      
      return aggregatedContent;
    } catch (error) {
      if (global.verbose || global.debug) {
        global.log(`❌ Parallel processing failed: ${error.message}`, 'error');
        global.log('🔄 Falling back to sequential processing...', 'warn');
      }
      
      // Fallback to original single-process approach
      return this.fallbackToSequential(projectInfo, targetDir, outputFile);
    }
  }

  defineProcessingChunks(projectInfo) {
    return [
      {
        name: 'structure',
        title: 'Code Structure Analysis',
        prompt: this.buildStructurePrompt(projectInfo),
        description: 'Analyzing file organization, dependencies, and architecture patterns'
      },
      {
        name: 'patterns',
        title: 'Implementation Patterns',
        prompt: this.buildPatternsPrompt(projectInfo),
        description: 'Extracting coding patterns, conventions, and function signatures'
      },
      {
        name: 'features',
        title: 'Feature Implementation Analysis',
        prompt: this.buildFeaturesPrompt(projectInfo),
        description: 'Analyzing existing features, data flow, and API patterns'
      },
      {
        name: 'config',
        title: 'Configuration & Testing',
        prompt: this.buildConfigPrompt(projectInfo),
        description: 'Processing test patterns, configs, and development workflow'
      },
      {
        name: 'content',
        title: 'Key File Content',
        prompt: this.buildContentPrompt(projectInfo),
        description: 'Extracting critical code implementations and utilities'
      }
    ];
  }

  async processChunk(chunk, index, targetDir) {
    const chunkId = `chunk-${index}-${chunk.name}`;
    const tempOutput = path.join(os.tmpdir(), `gsum-${chunkId}-${Date.now()}.txt`);
    
    if (global.verbose || global.debug) {
      global.log(`📝 Processing chunk ${index + 1}/5: ${chunk.title}`, 'info');
      global.log(`   ${chunk.description}`, 'verbose');
    }

    try {
      const result = await this.baseClient.executeGemini(
        chunk.prompt, 
        targetDir, 
        tempOutput, 
        path.join(os.tmpdir(), `gsum-error-${chunkId}-${Date.now()}.txt`)
      );

      // Read the output
      const content = await this.baseClient.readFile(tempOutput);
      
      return {
        name: chunk.name,
        title: chunk.title,
        content: content || '',
        success: true
      };
    } catch (error) {
      if (global.verbose || global.debug) {
        global.log(`⚠️  Chunk ${chunk.name} failed: ${error.message}`, 'warn');
      }
      
      return {
        name: chunk.name,
        title: chunk.title,
        content: `Error processing ${chunk.title}: ${error.message}`,
        success: false
      };
    } finally {
      // Cleanup
      try {
        await fs.unlink(tempOutput);
      } catch {}
    }
  }

  aggregateResults(results, projectInfo) {
    const header = this.buildHeaderSection(projectInfo);
    const sections = results.map(result => {
      if (result.success && result.content.trim()) {
        return `## ${result.title}\n\n${result.content.trim()}`;
      } else {
        return `## ${result.title}\n\n*Processing failed or no content generated.*`;
      }
    });

    return [header, ...sections].join('\n\n');
  }

  buildHeaderSection(projectInfo) {
    return `# ${projectInfo.name || 'Project'} - AI-Generated Summary

**Generated:** ${new Date().toISOString()}
**Processing:** Parallel Gemini Analysis (5 concurrent chunks)
**Directory:** ${projectInfo.path}

---`;
  }

  async fallbackToSequential(projectInfo, targetDir, outputFile) {
    if (global.verbose || global.debug) {
      global.log('📄 Using sequential fallback processing...', 'info');
    }
    
    // Use the base GeminiClient for fallback
    const prompt = this.buildFallbackPrompt(projectInfo, outputFile);
    return this.baseClient.generate(prompt, targetDir, outputFile);
  }

  buildFallbackPrompt(projectInfo, outputFile) {
    return `Analyze the following codebase and provide a comprehensive summary:

PROJECT INFORMATION:
${JSON.stringify(projectInfo, null, 2)}

Please provide a detailed analysis covering:
1. Architecture and code structure
2. Implementation patterns and conventions  
3. Key features and functionality
4. Configuration and testing approaches
5. Important file contents and implementations

Write the summary to the file: ${outputFile}

Focus on providing Claude with comprehensive context about this codebase.`;
  }

  buildStructurePrompt(projectInfo) {
    return `Analyze the codebase structure and provide a comprehensive overview focusing on:

PROJECT INFORMATION:
${JSON.stringify(projectInfo, null, 2)}

Please analyze and provide:

1. **File Organization & Module Boundaries**
   - Directory structure and purpose
   - Module organization patterns
   - Separation of concerns

2. **Dependency Mapping**
   - Import/export relationships
   - Critical dependency chains
   - External vs internal dependencies

3. **Architecture Patterns**
   - Design patterns in use
   - Architectural decisions
   - Component relationships

4. **Entry Points & Key Files**
   - Main application entry points
   - Configuration files
   - Critical infrastructure files

Focus on providing Claude with context about WHERE things are and HOW the codebase is organized, so Claude doesn't need to explore file structures.

Output as clean markdown sections.`;
  }

  buildPatternsPrompt(projectInfo) {
    return `Analyze implementation patterns and coding conventions:

PROJECT INFORMATION:
${JSON.stringify(projectInfo, null, 2)}

Please analyze and provide:

1. **Function & Class Signatures**
   - Key function signatures with file:line references
   - Class structures and interfaces
   - API endpoint definitions

2. **Coding Conventions**
   - Naming patterns
   - Code organization styles
   - Common patterns used

3. **Error Handling Approaches**
   - How errors are handled
   - Validation patterns
   - Error response formats

4. **Configuration Patterns**
   - How configuration is managed
   - Environment variable usage
   - Settings organization

Focus on providing Claude with context about HOW code is written and WHAT patterns to follow, so Claude doesn't need to read multiple files to understand conventions.

Output as clean markdown sections.`;
  }

  buildFeaturesPrompt(projectInfo) {
    return `Analyze existing feature implementations and patterns:

PROJECT INFORMATION:
${JSON.stringify(projectInfo, null, 2)}

Please analyze and provide:

1. **Feature Implementation Examples**
   - How existing features are structured
   - Implementation approaches used
   - File organization for features

2. **Data Flow Patterns**
   - How data moves through the application
   - State management approaches
   - Database interaction patterns

3. **API Patterns**
   - REST/GraphQL endpoint patterns
   - Request/response structures
   - Authentication/authorization flows

4. **Integration Patterns**
   - How external services are integrated
   - Third-party library usage
   - Plugin/extension patterns

Focus on providing Claude with context about HOW to implement similar features, so Claude doesn't need to reverse-engineer existing implementations.

Output as clean markdown sections.`;
  }

  buildConfigPrompt(projectInfo) {
    return `Analyze configuration, testing, and development patterns:

PROJECT INFORMATION:
${JSON.stringify(projectInfo, null, 2)}

Please analyze and provide:

1. **Testing Patterns**
   - Test structure and organization
   - Testing frameworks and utilities
   - Mock/stub patterns
   - Test data management

2. **Configuration Analysis**
   - Configuration file structures
   - Environment-specific settings
   - Feature flags or toggles

3. **Development Workflow**
   - Build processes and scripts
   - Development vs production differences
   - Deployment patterns

4. **Tooling Configuration**
   - Linting and formatting rules
   - Build tool configurations
   - Development dependencies

Focus on providing Claude with context about HOW to test, configure, and deploy changes, so Claude doesn't need to examine config files.

Output as clean markdown sections.`;
  }

  buildContentPrompt(projectInfo) {
    return `Extract and summarize key file contents and implementations:

PROJECT INFORMATION:
${JSON.stringify(projectInfo, null, 2)}

Please analyze and provide:

1. **Critical Code Implementations**
   - Key function implementations (with file:line references)
   - Important algorithms or business logic
   - Core utility functions

2. **Database Models & Schemas**
   - Data model definitions
   - Database schema structures
   - Relationship patterns

3. **Important Utilities**
   - Helper functions and utilities
   - Common libraries or modules
   - Shared components

4. **Configuration Values**
   - Important configuration settings
   - Default values and options
   - Environment-specific configurations

Focus on providing Claude with actual CODE CONTENT and implementations, so Claude doesn't need to read files to understand what exists.

Include file:line references for key implementations.
Output as clean markdown sections.`;
  }
}

module.exports = { ParallelGeminiClient };