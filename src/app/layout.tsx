import type { Metadata, Viewport } from 'next'
import { Recursive, Plus_Jakarta_Sans } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import { SITE_URL } from '@/lib/constants'
import './globals.css'

const recursive = Recursive({
  subsets: ['latin'],
  variable: '--font-recursive',
  display: 'swap',
  axes: ['CASL', 'CRSV', 'MONO'],
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

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
    <html lang="en" className={`${recursive.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
