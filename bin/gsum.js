#!/usr/bin/env node

/**
 * gsum CLI - npm entry point
 * AI-powered codebase summarization with smart context optimization
 */

const path = require('path');

// Import the CLI from the existing implementation
const cliPath = path.join(__dirname, '../cli/gsum.js');

// Re-export the CLI functionality
require(cliPath);