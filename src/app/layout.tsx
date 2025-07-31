
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    template: '%s | Berez Cashier',
    default: 'Berez Cashier - Aplikasi Kasir Modern',
  },
  description: 'Berez Cashier adalah aplikasi Point of Sale (POS) modern yang dirancang untuk UMKM. Kelola transaksi, stok, dan laporan keuangan dengan mudah dan terintegrasi.',
  keywords: ['aplikasi kasir', 'pos', 'point of sale', 'manajemen stok', 'umkm', 'berez', 'kasir', 'keuangan', 'laporan penjualan'],
  authors: [{ name: 'Berez.id', url: 'https://berez.id' }],
  creator: 'Berez.id',
  publisher: 'Berez.id',
  metadataBase: new URL('https://berez-cashier.web.app'), // Ganti dengan URL produksi Anda
  openGraph: {
    title: 'Berez Cashier - Aplikasi Kasir Modern untuk UMKM',
    description: 'Kelola transaksi, stok, dan laporan keuangan dengan mudah menggunakan Berez Cashier. Terintegrasi, cepat, dan handal.',
    url: 'https://berez-cashier.web.app', // Ganti dengan URL produksi Anda
    siteName: 'Berez Cashier',
    images: [
      {
        url: '/og-image.png', // Pastikan Anda memiliki gambar ini di folder /public
        width: 1200,
        height: 630,
        alt: 'Berez Cashier App Interface',
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Berez Cashier - Aplikasi Kasir Modern untuk UMKM',
    description: 'Tingkatkan efisiensi bisnis Anda dengan Berez Cashier. Aplikasi POS modern untuk manajemen transaksi, stok, dan keuangan.',
    images: ['/twitter-image.png'], // Pastikan Anda memiliki gambar ini di folder /public
    creator: '@berez_id', // Ganti dengan handle Twitter Anda
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src *; img-src * data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; frame-src data:;"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
