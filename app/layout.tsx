import React from "react"
import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PwaInstallPrompt } from '@/components/pwa-install-prompt'
import { PwaRegister } from '@/components/pwa-register'
import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-serif'
});
const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: 'PrestaBridge - Votre Événement Sur-Mesure',
  description: 'La marketplace événementielle premium. Créez votre événement parfait avec notre IA ou personnalisez chaque détail.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  applicationName: 'PrestaBridge',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PrestaBridge',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <Header />
        {children}
        <Footer />
        <PwaRegister />
        <PwaInstallPrompt />
        <Analytics />
      </body>
    </html>
  )
}
