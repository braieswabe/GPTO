#!/bin/bash

# Install pnpm script for GPTO Suite

echo "🔧 Installing pnpm..."

# Method 1: Using npm (if you have sudo/admin access)
if command -v npm &> /dev/null; then
  echo "📦 Attempting to install via npm..."
  npm install -g pnpm || {
    echo "⚠️  npm install failed. Trying alternative method..."
  }
fi

# Method 2: Using standalone installer (recommended)
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing via standalone installer..."
  curl -fsSL https://get.pnpm.io/install.sh | sh -
  
  # Add to PATH for current session
  export PNPM_HOME="$HOME/.local/share/pnpm"
  export PATH="$PNPM_HOME:$PATH"
fi

# Method 3: Using Homebrew (macOS)
if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
  if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing via Homebrew..."
    brew install pnpm
  fi
fi

# Verify installation
if command -v pnpm &> /dev/null; then
  echo "✅ pnpm installed successfully!"
  echo "   Version: $(pnpm -v)"
  echo ""
  echo "🚀 You can now run:"
  echo "   pnpm install"
  echo "   pnpm dev"
else
  echo "❌ pnpm installation failed."
  echo ""
  echo "Please install manually using one of these methods:"
  echo ""
  echo "1. Standalone installer (recommended):"
  echo "   curl -fsSL https://get.pnpm.io/install.sh | sh"
  echo ""
  echo "2. Using npm:"
  echo "   npm install -g pnpm"
  echo ""
  echo "3. Using Homebrew (macOS):"
  echo "   brew install pnpm"
  echo ""
  echo "After installation, restart your terminal and run:"
  echo "   pnpm install"
fi
