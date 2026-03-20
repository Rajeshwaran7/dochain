const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /** Served under `/doctor` when using a single-host reverse proxy (see `deploy/nginx.example.conf`). */
  basePath: '/doctor',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_BASE_PATH: '/doctor',
  },
};

module.exports = withPWA(nextConfig);
