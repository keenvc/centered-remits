/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cache-busting: Generate content hashes for all assets
  generateBuildId: async () => {
    // Use timestamp + random for unique build IDs
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },
  // Proper cache headers
  async headers() {
    return [
      {
        // Cache static assets aggressively (JS, CSS have content hashes)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Never cache HTML pages
        source: '/:path((?!_next|api).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
