const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/**
 * `true` = no basePath (site root). Use only when the app is served without `/doctor`.
 * If `true` but you open `http://localhost:3002/doctor/...`, `/doctor/_next/...` will 404.
 * Local dev with `/doctor`: leave unset or `false`. See `apps/web-doctor/.env.example`.
 */
const standalone = process.env.NEXT_PUBLIC_STANDALONE_DEPLOY === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(!standalone && { basePath: '/doctor' }),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_BASE_PATH: standalone ? '' : '/doctor',
  },
  /**
   * Without this, opening http://localhost:3002/ 404s and browsers may request /_next/* instead of /doctor/_next/*.
   * Send users to the app under basePath.
   */
  async redirects() {
    if (standalone) return [];
    return [
      {
        source: '/',
        destination: '/doctor',
        permanent: false,
        basePath: false,
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
