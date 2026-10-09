/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable standalone output for Docker production builds
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    // Photos are downscaled in the browser, but allow a few full-size originals.
    serverActions: { bodySizeLimit: '30mb' },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  // Keep old links and printed QR codes working.
  async redirects() {
    return [
      { source: '/claim', destination: '/tasks', permanent: false },
      { source: '/task/create', destination: '/tasks/new', permanent: false },
      { source: '/task/edit/:id', destination: '/tasks/:id/edit', permanent: false },
      { source: '/task/:id', destination: '/tasks/:id', permanent: false },
      { source: '/volunteer/register', destination: '/signup', permanent: false },
      { source: '/volunteer/creations', destination: '/creations', permanent: false },
      { source: '/volunteer/:path*', destination: '/me', permanent: false },
      { source: '/volunteer', destination: '/me', permanent: false },
      { source: '/auth/register', destination: '/signup', permanent: false },
      { source: '/auth/discord', destination: '/login', permanent: false },
      { source: '/admin/:path+', destination: '/admin', permanent: false },
    ];
  },
};

export default nextConfig;
