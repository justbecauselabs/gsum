# npm link vs ~/bin Installation Consideration

## Current Approach: ~/bin Installation

**Pros:**
- Simple and predictable
- No npm global permissions issues
- Works consistently across systems
- Easy to debug (just a bash script)
- No symlink complexity
- Update mechanism is straightforward

**Cons:**
- Requires adding ~/bin to PATH
- Not the "standard" npm way

## Alternative: npm link

**Pros:**
- Standard npm approach
- Automatically handles PATH (via npm bin)
- Familiar to Node.js developers

**Cons:**
- Requires npm global write permissions
- Can have issues with different Node versions
- Symlinks can break or get confused
- Harder to debug when things go wrong
- Update mechanism more complex
- May require sudo on some systems

## Recommendation

Stay with ~/bin approach because:
1. gsum targets developers who may not be Node.js experts
2. Avoids npm permission headaches
3. The wrapper script approach is more robust
4. Update mechanism (`gsum update`) works reliably
5. Installation is more transparent and debuggable

If we want to support both in the future, we could add:
```bash
make install-npm  # Uses npm link
make install      # Current ~/bin approach
```