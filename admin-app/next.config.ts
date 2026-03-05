import type { NextConfig } from 'next';

const adminApiUrl =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/admin',
  experimental: {
    proxyClientMaxBodySize: '2gb',
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/admin/:path*',
          destination: `${adminApiUrl}/:path*`,
          basePath: false,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
