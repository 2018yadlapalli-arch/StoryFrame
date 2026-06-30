#!/usr/bin/env bash
# Offline install of Claude Code on a Linux x64 (glibc) machine.
# Copy this whole folder to the offline machine, then run:  bash install-linux.sh
set -euo pipefail

WRAPPER="anthropic-ai-claude-code-2.1.196.tgz"
NATIVE="anthropic-ai-claude-code-linux-x64-2.1.196.tgz"

# ---------------------------------------------------------------------------
# OPTION A (recommended, no npm/Node needed): extract the standalone binary.
# The `claude` file inside the native tarball IS the complete executable.
# ---------------------------------------------------------------------------
echo "Extracting standalone binary..."
tar -xzf "$NATIVE"                 # creates ./package/claude
mkdir -p "$HOME/.local/bin"
cp package/claude "$HOME/.local/bin/claude"
chmod +x "$HOME/.local/bin/claude"
echo "Installed to $HOME/.local/bin/claude"
echo "Make sure $HOME/.local/bin is on your PATH, then run:  claude --version"

# ---------------------------------------------------------------------------
# OPTION B (npm global install) -- uncomment if you prefer npm to manage it.
# Requires Node.js 18+ already present on the offline machine.
#   npm install -g "./$NATIVE"     # install native binary first
#   npm install -g "./$WRAPPER"    # then the wrapper (postinstall finds the native pkg)
# ---------------------------------------------------------------------------
