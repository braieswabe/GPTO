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
  // Ensure path aliases work
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src'),
    };
    return config;
  },
};

module.exports = nextConfig;
