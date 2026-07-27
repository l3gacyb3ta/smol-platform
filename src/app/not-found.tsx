import Link from 'next/link'
import Wordmark from '@/components/Wordmark'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="grid-bg hero-glow flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Link href="/">
        <Wordmark />
      </Link>
      <p className="font-display text-6xl font-extrabold text-hc-dark">404</p>
      <div>
        <h1 className="font-display text-xl font-bold text-hc-dark">
          There&apos;s nothing at this address
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          The program may have been deleted, or the link may have a typo in it.
        </p>
      </div>
      <Link href="/" className="btn btn-primary">
        Back to smol
      </Link>
    </div>
  )
}
