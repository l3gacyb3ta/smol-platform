import type { Metadata, Viewport } from 'next'
import AuthProvider from '@/components/AuthProvider'
import { SITE_URL } from '@/lib/constants'
import './globals.css'

// No webfonts, on purpose. Body text is set in whatever sans the reader's
// system already has: nothing to download, nothing to wait for on a bad
// connection, and no flash of unstyled text. See globals.css for the tokens.

const TITLE = 'smol — small build challenges, real rewards'
const DESCRIPTION =
  'Tiny You Ship We Ship programs from Hack Club. Ship a small project, and we ship you something you actually want.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — smol',
  },
  description: DESCRIPTION,
  applicationName: 'smol',
  keywords: ['Hack Club', 'You Ship We Ship', 'YSWS', 'teen programmers', 'hackathon'],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'smol',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

export const viewport: Viewport = {
  themeColor: '#ec3750',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
