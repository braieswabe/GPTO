# GPTO Suite - Quick Start Guide

Get the GPTO Suite frontend running in 5 minutes!

## Step 0: Install pnpm

**pnpm is required!** If you don't have it installed:

### Option 1: Standalone Installer (Recommended)
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh
```

Then **restart your terminal** or run:
```bash
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"
```

### Option 2: Using npm
```bash
npm install -g pnpm
```

### Option 3: Using Homebrew (macOS)
```bash
brew install pnpm
```

### Option 4: Use npx (No Installation)
If you can't install pnpm, use npx instead:
```bash
# Use npx pnpm instead of pnpm for all commands
npx pnpm install
npx pnpm dev
```

**Verify installation:**
```bash
pnpm --version
# Should show: 8.15.0 or higher
```

See `INSTALL_PNPM.md` for detailed installation instructions.

## Step 1: Install Dependencies

```bash
pnpm install
```

(Or use `npx pnpm install` if pnpm isn't installed globally)

## Step 2: Start Development Server

```bash
pnpm dev
```

(Or use `npx pnpm dev` if pnpm isn't installed globally)

That's it! The dashboard will be running at `http://localhost:3000`

## What You'll See

1. **Landing Page** (`/`) - Marketing page with features and CTA
2. **Dashboard** (`/dashboard`) - Main control panel
3. **Sites** (`/sites`) - Site management (requires auth for real data)
4. **PantheraChat** (`/chat`) - AI chatbot interface
5. **Settings** (`/settings`) - Configuration and exports

## Building for Production

```bash
# Build everything
pnpm build

# Start production server
pnpm --filter dashboard start
```

## Troubleshooting

### Port 3000 already in use?

```bash
# Use a different port
pnpm --filter dashboard dev -- -p 3001
```

### Module not found errors?

```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### TypeScript errors?

```bash
# Build all packages first
pnpm build
```

### pnpm command not found?

1. Make sure you've installed pnpm (see Step 0 above)
2. Restart your terminal after installation
3. Or use `npx pnpm` instead of `pnpm`

## Next Steps

- Read `BUILD_INSTRUCTIONS.md` for detailed setup
- Check `DEPLOYMENT.md` for production deployment
- See `IMPLEMENTATION_SUMMARY.md` for feature overview
- See `INSTALL_PNPM.md` for pnpm installation help

## Features Available

✅ Modern React + TypeScript frontend  
✅ Next.js 14 App Router  
✅ Tailwind CSS styling  
✅ Responsive design  
✅ Navigation and routing  
✅ Dashboard UI  
✅ Telemetry visualization  
✅ Chat interface  
✅ Export functionality  

Enjoy building with GPTO Suite! 🚀
