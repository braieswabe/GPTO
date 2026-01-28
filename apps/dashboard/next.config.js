const path = require('path');

// Load environment variables from root .env file
// Next.js only loads .env from the directory where next.config.js is located
// So we manually load from the root directory
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {
  // dotenv might not be available, but Next.js will handle env loading
  console.warn('Could not load .env from root, ensure DATABASE_URL is set in apps/dashboard/.env.local');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@gpto/api',
    '@gpto/api-lattice',
    '@gpto/audit',
    '@gpto/database',
    '@gpto/schemas',
    '@gpto/shared',
    '@gpto/servos-agcc',
    '@gpto/servos-chatbot',
    '@gpto/servos-candidate-first',
    '@gpto/servos-email',
    '@gpto/servos-gpto',
    '@gpto/servos-mibi',
    '@gpto/servos-paid',
    '@gpto/servos-social',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Disable source maps to avoid reading source code from node_modules
  // This works around sandbox file permission restrictions
  productionBrowserSourceMaps: false,
  
  // Add empty turbopack config to silence Next.js 16 warning
  // We're using webpack config, so we'll use --webpack flag
  turbopack: {},
  
  // Ensure path aliases work
  webpack: (config, { isServer }) => {
    const path = require('path');
    const rootDir = path.resolve(__dirname, '../..');
    
    // Add workspace package aliases for webpack resolution
    // Point to package root so subpaths like /src/schema work correctly
    // This ensures webpack uses the root package, not nested node_modules
    const workspaceAliases = {
      '@': path.resolve(__dirname, './src'),
      '@gpto/schemas': path.resolve(rootDir, 'packages/schemas'),
      '@gpto/shared': path.resolve(rootDir, 'packages/shared'),
      '@gpto/api': path.resolve(rootDir, 'packages/api'),
      '@gpto/api-lattice': path.resolve(rootDir, 'packages/api-lattice'),
      '@gpto/database': path.resolve(rootDir, 'packages/database'),
      '@gpto/telemetry': path.resolve(rootDir, 'packages/telemetry'),
      '@gpto/governance': path.resolve(rootDir, 'packages/governance'),
      '@gpto/audit': path.resolve(rootDir, 'packages/audit'),
      '@gpto/servos-agcc': path.resolve(rootDir, 'packages/servos/agcc'),
      '@gpto/servos-chatbot': path.resolve(rootDir, 'packages/servos/chatbot'),
      '@gpto/servos-candidate-first': path.resolve(rootDir, 'packages/servos/candidate-first'),
      '@gpto/servos-email': path.resolve(rootDir, 'packages/servos/email'),
      '@gpto/servos-gpto': path.resolve(rootDir, 'packages/servos/gpto'),
      '@gpto/servos-mibi': path.resolve(rootDir, 'packages/servos/mibi'),
      '@gpto/servos-paid': path.resolve(rootDir, 'packages/servos/paid'),
      '@gpto/servos-social': path.resolve(rootDir, 'packages/servos/social'),
    };
    
    // Merge with existing aliases, but workspace aliases take precedence
    config.resolve.alias = {
      ...config.resolve.alias,
      ...workspaceAliases,
    };
    
    // Disable source map reading to avoid file permission issues
    config.devtool = false;
    
    // Ignore errors when reading source code from node_modules
    config.ignoreWarnings = [
      { module: /node_modules/ },
    ];
    
    // Ensure dependencies are resolved from workspace root and pnpm structure
    const rootNodeModules = path.resolve(rootDir, 'node_modules');
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      rootNodeModules,
      path.resolve(rootDir, 'packages/audit/node_modules'),
      'node_modules',
    ];
    
    // Configure webpack to resolve strnum from pnpm's nested node_modules structure
    config.resolve.symlinks = false;
    
    // Add externals for server-side only packages to avoid bundling issues
    if (isServer) {
      // For server-side, we can use Node.js require, but we still need to resolve workspace packages
      // The aliases above should handle this
    } else {
      // For client-side, exclude server-only packages
      config.resolve.alias = {
        ...config.resolve.alias,
        // Exclude pdfkit and fontkit from client bundle if not needed
      };
    }
    
    // Handle fontkit/pdfkit compatibility issue and Node.js built-ins
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
    };
    
    // Configure webpack to handle pdfkit/fontkit ESM issues
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Exclude TypeScript source files from nested node_modules
    // This prevents webpack from trying to parse .ts files in nested pnpm node_modules
    // Note: This rule must come before other rules that process .ts files
    const existingRules = config.module.rules || [];
    config.module.rules = [
      {
        test: /\.tsx?$/,
        exclude: (modulePath) => {
          // Allow transpiling workspace packages (they're in transpilePackages)
          if (modulePath.includes('packages/') && !modulePath.includes('node_modules')) {
            return false;
          }
          // Exclude TypeScript files from nested node_modules
          if (modulePath.includes('node_modules') && modulePath.match(/node_modules[\\/].*[\\/]node_modules/)) {
            return true;
          }
          return false;
        },
      },
      ...existingRules,
    ];
    
    // Exclude pdfkit/fontkit from SWC processing - they have compatibility issues
    // Mark them as externals for server-side builds since they're Node.js-only
    if (isServer) {
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (/^(pdfkit|fontkit)$/.test(request)) {
              return callback(null, `commonjs ${request}`);
            }
            callback();
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push(/^(pdfkit|fontkit)$/);
      }
    } else {
      // For client-side, exclude pdfkit entirely (it's server-only)
      config.resolve.alias = {
        ...config.resolve.alias,
        pdfkit: false,
        fontkit: false,
      };
    }
    
    // Fix entities package export issue (used by cheerio/htmlparser2)
    config.module.rules.push({
      test: /node_modules[\\/]entities[\\/]/,
      resolve: {
        exportsFields: ['exports', 'main'],
      },
    });
    
    // Configure webpack to resolve entities subpaths (decode, escape)
    // The package exports ./lib/decode.js and ./lib/escape.js, but htmlparser2 imports ./decode and ./escape
    const entitiesLibPath = path.resolve(rootNodeModules, 'entities/lib');
    config.resolve.alias = {
      ...config.resolve.alias,
      'entities/decode': path.resolve(entitiesLibPath, 'decode.js'),
      'entities/escape': path.resolve(entitiesLibPath, 'escape.js'),
      'entities/lib/decode': path.resolve(entitiesLibPath, 'decode.js'),
      'entities/lib/escape': path.resolve(entitiesLibPath, 'escape.js'),
    };
    
    // Ensure strnum can be resolved from pnpm's nested structure
    // Try multiple possible locations
    const strnumPaths = [
      path.resolve(rootNodeModules, 'strnum'),
      path.resolve(rootDir, 'packages/audit/node_modules/strnum'),
      path.resolve(rootDir, 'packages/audit/node_modules/fast-xml-parser/node_modules/strnum'),
    ];
    
    const fs = require('fs');
    for (const strnumPath of strnumPaths) {
      try {
        if (fs.existsSync(strnumPath) || fs.existsSync(strnumPath + '/package.json')) {
          config.resolve.alias = {
            ...config.resolve.alias,
            strnum: strnumPath,
          };
          break;
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    return config;
  },
};

module.exports = nextConfig;
