/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Served under `/admin` when using a single-host reverse proxy (see `deploy/nginx.example.conf`). */
  basePath: '/admin',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_BASE_PATH: '/admin',
  },
};

module.exports = nextConfig;
