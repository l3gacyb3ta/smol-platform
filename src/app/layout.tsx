import type { Metadata } from 'next'
import { Recursive, Plus_Jakarta_Sans } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
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

export const metadata: Metadata = {
  title: 'Smol — You Ship We Ship',
  description: 'Manage small YSWS programs with big fun.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${recursive.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
