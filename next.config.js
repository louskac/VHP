/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      // Fix for face-api.js and node-fetch issues
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          encoding: false,
          util: false,
          path: false,
          os: false,
        };
      }
      
      return config;
    },
  };
  
  module.exports = nextConfig;