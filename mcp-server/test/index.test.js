import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MCP Server Tests', () => {
  let tempDir;
  
  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gsum-test-'));
  });
  
  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  describe('Server Initialization', () => {
    it('should start the server and respond to list_tools request', async () => {
      const serverPath = path.join(__dirname, '..', 'index.js');
      const server = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Send list_tools request
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      };
      
      server.stdin.write(JSON.stringify(request) + '\n');
      
      // Wait for response
      const response = await new Promise((resolve, reject) => {
        let data = '';
        server.stdout.on('data', (chunk) => {
          data += chunk.toString();
          try {
            const lines = data.split('\n').filter(line => line.trim());
            for (const line of lines) {
              const parsed = JSON.parse(line);
              if (parsed.id === 1) {
                resolve(parsed);
              }
            }
          } catch (e) {
            // Continue collecting data
          }
        });
        
        server.on('error', reject);
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });
      
      // Clean up
      server.kill();
      
      assert.strictEqual(response.result.tools.length, 1);
      assert.strictEqual(response.result.tools[0].name, 'summarize_directory');
    });
  });
  
  describe('File Analysis', () => {
    it('should correctly extract imports from JavaScript files', async () => {
      // Create test files
      const testFile = path.join(tempDir, 'test.js');
      await fs.writeFile(testFile, `
import React from 'react';
import { useState, useEffect } from 'react';
const lodash = require('lodash');
require('./utils');
      `);
      
      // We'll need to extract the analyzeFile method for unit testing
      // For now, this is a placeholder for the test structure
    });
    
    it('should detect technology stack correctly', async () => {
      // Create test package.json
      const packageJson = {
        name: 'test-project',
        dependencies: {
          'react': '^18.0.0',
          'express': '^4.18.0',
          'next': '^13.0.0'
        }
      };
      
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      // Create React component
      await fs.writeFile(
        path.join(tempDir, 'App.jsx'),
        `import React from 'react';\nexport default function App() { return <div>Test</div>; }`
      );
      
      // Test technology detection
      // This would be tested through the full server flow
    });
  });
  
  describe('Performance Tests', () => {
    it('should handle multiple files efficiently', async () => {
      // Create multiple test files
      const fileCount = 50;
      for (let i = 0; i < fileCount; i++) {
        await fs.writeFile(
          path.join(tempDir, `file${i}.js`),
          `export function func${i}() { return ${i}; }`
        );
      }
      
      // Measure performance
      const startTime = Date.now();
      
      // TODO: Run actual analysis
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Performance should be reasonable
      assert.ok(duration < 5000, `Analysis took too long: ${duration}ms`);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle permission errors gracefully', async () => {
      // Create a directory with no read permissions
      const restrictedDir = path.join(tempDir, 'restricted');
      await fs.mkdir(restrictedDir);
      await fs.chmod(restrictedDir, 0o000);
      
      // Test should not throw
      // TODO: Test actual server behavior
      
      // Restore permissions for cleanup
      await fs.chmod(restrictedDir, 0o755);
    });
    
    it('should skip binary files', async () => {
      // Create a fake binary file
      await fs.writeFile(
        path.join(tempDir, 'image.jpg'),
        Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])
      );
      
      // Binary file should be skipped
      // TODO: Test actual server behavior
    });
  });
});