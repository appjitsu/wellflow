/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure for Railway deployment
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Ensure proper hostname binding for Railway
  async rewrites() {
    return [];
  },
};

export default nextConfig;
