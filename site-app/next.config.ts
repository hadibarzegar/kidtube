import type { NextConfig } from 'next';

const siteApiUrl =
  process.env.SITE_API_INTERNAL_URL ?? 'http://localhost:8081';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/site/:path*',
        destination: `${siteApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
