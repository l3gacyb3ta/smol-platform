'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="grid-bg hero-glow flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Link href="/">
        <Wordmark />
      </Link>
      <span className="text-4xl">🧯</span>
      <div>
        <h1 className="font-display text-xl font-bold text-hc-dark">
          Well, that broke
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          Something on our end fell over. Retrying usually sorts it — if it
          doesn&apos;t, shout in the Hack Club Slack.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-gray-400">ref: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={() => unstable_retry()} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-secondary">
          Back to smol
        </Link>
      </div>
    </div>
  )
}
