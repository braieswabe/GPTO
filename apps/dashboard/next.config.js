/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
