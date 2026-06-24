import type { Metadata } from 'next'
import { Recursive, Hanken_Grotesk } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import './globals.css'

const recursive = Recursive({
  subsets: ['latin'],
  variable: '--font-recursive',
  display: 'swap',
  axes: ['CASL', 'CRSV', 'MONO'],
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Smol — You Ship We Ship',
  description: 'Manage small YSWS programs with big fun.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${recursive.variable} ${hanken.variable}`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
