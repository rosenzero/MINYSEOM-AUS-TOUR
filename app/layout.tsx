import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NowBar } from '@/components/NowBar';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { OfflineBadge } from '@/components/OfflineBadge';
import { TRIP } from '@/lib/trip';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com';

const description = `${TRIP.info.startDate} – ${TRIP.info.endDate} · ${TRIP.days.length}일간의 일정`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TRIP.info.title, template: `%s · ${TRIP.info.title}` },
  description,
  applicationName: TRIP.info.title,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: TRIP.info.title,
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/icon-192.svg' }],
  },
  openGraph: {
    title: TRIP.info.title,
    description,
    type: 'website',
    locale: 'ko_KR',
    siteName: TRIP.info.title,
  },
  twitter: {
    card: 'summary_large_image',
    title: TRIP.info.title,
    description,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 pb-[calc(env(safe-area-inset-bottom)+9rem)]">
        {children}
        <OfflineBadge />
        <NowBar />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
