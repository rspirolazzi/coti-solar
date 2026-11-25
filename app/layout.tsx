import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import { Toaster } from 'sonner';
import { StoreHydrator } from '@/components/StoreHydrator';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const appUrl = process.env.APP_URL || 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'CotiSolar — Cálculo de Sistema Fotovoltaico',
    template: '%s · CotiSolar',
  },
  description: 'Dimensionamiento y presupuestos de sistemas solares fotovoltaicos.',
  applicationName: 'CotiSolar',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'CotiSolar — la cuenta que cierra',
    description: 'Dimensionamiento y presupuestos fotovoltaicos.',
    type: 'website',
    images: ['/icons/icon-512.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0C2233',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sora.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans">
        <StoreHydrator />
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
