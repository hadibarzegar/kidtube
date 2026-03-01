import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/admin',
  env: {
    ADMIN_API_INTERNAL_URL: process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082',
  },
};

export default nextConfig;
