import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { JsonLd } from '@/components/shared/JsonLd'
import { LeadTrackingInit } from '@/components/shared/LeadTrackingInit'
import { websiteSchema, organizationSchema } from '@/lib/schema'
import { SITE_URL } from '@/config/api'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CDC Universitas Stekom, Portal Karir Terpercaya',
    template: '%s | CDC Universitas Stekom',
  },
  description:
    'Career Development Center Universitas STEKOM. Temukan lowongan kerja, magang, dan event rekrutmen terbaik. Gratis untuk semua pencari kerja.',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'CDC Universitas Stekom',
  },
  twitter: { card: 'summary_large_image' },
  formatDetection: { telephone: false, date: false, email: false, address: false },
  // Google Search Console ownership check. Read from the environment so the
  // token is not committed, and omitted entirely when unset — an empty
  // <meta google-site-verification> would fail verification rather than skip it.
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${plusJakarta.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {/* Runs before hydration; strips extension-injected attrs (BIS) that break hydration. External src avoids the inline-script warning. */}
        <Script src="/strip-ext-attrs.js" strategy="beforeInteractive" />
        <JsonLd schema={websiteSchema()} />
        <JsonLd schema={organizationSchema()} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <LeadTrackingInit />
      </body>
    </html>
  )
}
