# Implementation Plan: `gsum` Test Task

## 1. Overview of the Approach

This plan details the implementation of a test task for the `gsum` project. The task involves creating a new `gsum` command called `diff`. This command will generate summaries for the same set of files at two different git revisions (e.g., branches, commits, or tags) and then output a diff of the two summaries. This will allow users to quickly see how the semantic meaning of their code has changed between versions.

The implementation will follow the existing command structure, adding a new `diff.js` file in `cli/lib/commands/`. We will leverage the existing `analyzer.js` and `git.js` modules to handle summary generation and git operations.

## 2. Step-by-Step Implementation Guide

### Step 1: Create the `diff` command file

Create a new file `cli/lib/commands/diff.js`. This file will contain the core logic for the `diff` command, including argument parsing, orchestrating the git operations and summary generation, and producing the final output.

### Step 2: Register the new command

In `cli/gsum.js`, import and register the new `diff` command so that it is exposed to the user through the command-line interface.

### Step 3: Implement the `diff` command logic

In `cli/lib/commands/diff.js`, implement the following logic:
1.  Define the command-line interface using `yargs`, accepting two required arguments: `<ref1>` and `<ref2>`.
2.  Use the `git.js` module to get the current branch name and stash any uncommitted changes to ensure a clean working tree.
3.  Check out `<ref1>`.
4.  Run the summary generation process for the target files (similar to the existing `summary` command). Store the output temporarily.
5.  Check out `<ref2>`.
6.  Run the summary generation process again.
7.  Compute the diff between the two generated summaries. A simple text diff will suffice for the initial implementation.
8.  Print the formatted diff to the console.
9.  Use a `finally` block to ensure the original branch is checked out and the stashed changes are reapplied, even if errors occur.

### Step 4: Add a new test script

Create a test script `tests/test-diff-command.sh` to provide automated testing for the new command.

## 3. Files to be Modified or Created

-   **New File:** `/Users/jhurray/src/gsum/cli/lib/commands/diff.js`
-   **Modified File:** `/Users/jhurray/src/gsum/cli/gsum.js`
-   **New File:** `/Users/jhurray/src/gsum/tests/test-diff-command.sh`

## 4. Code Examples

### `/Users/jhurray/src/gsum/cli/gsum.js`

```javascript
#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// ... other command imports

// Add this line to import the new diff command
const diffCommand = require('./lib/commands/diff');

const argv = yargs(hideBin(process.argv))
  .command(require('./lib/commands/summary'))
  .command(require('./lib/commands/plan'))
  .command(require('./lib/commands/interactive'))
  .command(require('./lib/commands/save'))
  .command(require('./lib/commands/update'))
  .command(require('./lib/commands/fingerprint'))
  .command(require('./lib/commands/llm-usage'))
  // Add this line to register the new command
  .command(diffCommand)
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;
```

### `/Users/jhurray/src/gsum/cli/lib/commands/diff.js` (Initial Skeleton)

```javascript
const git = require('../git');
const analyzer = require('../analyzer');
const diff = require('diff');

exports.command = 'diff <ref1> <ref2>';
exports.desc = 'Diff summaries between two git refs';
exports.builder = (yargs) => {
  yargs.positional('ref1', {
    describe: 'First git ref (branch, commit, tag)',
    type: 'string',
  }).positional('ref2', {
    describe: 'Second git ref (branch, commit, tag)',
    type: 'string',
  });
};

exports.handler = async (argv) => {
  const { ref1, ref2 } = argv;
  console.log(`Generating summary diff between ${ref1} and ${ref2}...`);

  let originalBranch;
  try {
    originalBranch = await git.getCurrentBranch();
    // Stash changes if necessary
    await git.stash();

    // Summary for ref1
    await git.checkout(ref1);
    const summary1 = await analyzer.analyze(argv); // Assuming analyze can be reused

    // Summary for ref2
    await git.checkout(ref2);
    const summary2 = await analyzer.analyze(argv);

    // Calculate and display diff
    const summaryDiff = diff.createPatch('summary.md', summary1, summary2, 'old version', 'new version');
    console.log(summaryDiff);

  } catch (error) {
    console.error('An error occurred during the diff process:', error);
  } finally {
    // Cleanup
    if (originalBranch) {
      await git.checkout(originalBranch);
      await git.stashPop();
    }
  }
};
```

## 5. Testing Approach and Test Cases

A new bash script `tests/test-diff-command.sh` will be created.

**Test Case 1: Basic Diff**
1.  Initialize a new git repository in a temporary directory.
2.  Create a file `test.js` with some content and commit it to `main`.
3.  Create a new branch `feature`.
4.  Modify `test.js` in the `feature` branch and commit the change.
5.  Run `gsum diff main feature`.
6.  Assert that the output contains a diff showing the changes between the summaries of `test.js` on the two branches.

**Test Case 2: No Changes**
1.  Follow steps 1-2 from the previous test case.
2.  Run `gsum diff main main`.
3.  Assert that the output shows no differences.

**Test Case 3: Invalid Git Ref**
1.  Initialize a git repository.
2.  Run `gsum diff main non-existent-branch`.
3.  Assert that the command exits with an error and prints a user-friendly message.

## 6. Potential Challenges and Solutions

-   **Challenge:** The working directory might have uncommitted changes.
    -   **Solution:** Use `git stash` to save the changes before checking out different branches and `git stash pop` to restore them afterward. This must be handled robustly in a `finally` block.
-   **Challenge:** The summary generation process might be slow, making the `diff` command feel unresponsive.
    -   **Solution:** For the initial implementation, we will accept the latency. Future optimizations could involve caching summaries by commit hash.
-   **Challenge:** The `analyzer.js` module may not be designed for this kind of programmatic, repeated use.
    -   **Solution:** Refactor `analyzer.js` if necessary to better separate its concerns, making it easier to call from different commands without relying on command-line arguments directly.

## 7. Verification Steps

1.  Run the new test script and ensure all test cases pass: `bash tests/test-diff-command.sh`.
2.  Manually run the command on the `gsum` project itself. For example, run `gsum diff HEAD~1 HEAD`.
3.  Verify that the output is a well-formatted and accurate diff of the summaries.
4.  Check that after the command finishes, the original git branch is restored and any stashed changes are reapplied correctly.
