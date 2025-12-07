/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false, // Disable Turbopack to avoid test file issues
  },
  webpack: (config) => {
    // Exclude test files and LICENSE files from the build
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      loader: 'ignore-loader',
    });

    config.module.rules.push({
      test: /LICENSE$/,
      loader: 'ignore-loader',
    });

    return config;
  },
};

export default nextConfig;