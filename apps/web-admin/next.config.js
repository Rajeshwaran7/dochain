/** Set `NEXT_PUBLIC_STANDALONE_DEPLOY=true` on Vercel so this app is the site root (no `/admin` prefix). Omit for nginx single-host. */
const standalone = process.env.NEXT_PUBLIC_STANDALONE_DEPLOY === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(!standalone && { basePath: '/admin' }),
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
    NEXT_PUBLIC_BASE_PATH: standalone ? '' : '/admin',
  },
};

module.exports = nextConfig;
