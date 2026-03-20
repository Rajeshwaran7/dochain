import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['400','500','600','700','800'],
});

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: { default: 'Dochain — Admin', template: '%s | Dochain Admin' },
  description: 'Admin dashboard for Dochain.',
  manifest: `${basePath}/manifest.json`,
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Dochain Admin' },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon-192x192.png`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
