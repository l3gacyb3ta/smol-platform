'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { editionLine } from '@/lib/edition'

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
    <main className="sheet sheet-form" style={{ paddingTop: '48px' }}>
      <Link href="/" className="site-mark">
        <Wordmark />
      </Link>

      <h1>Well, that broke</h1>
      <p>
        Something on our end fell over. Retrying usually sorts it — if it doesn&apos;t, shout in the{' '}
        <a href="https://hackclub.com/slack/" target="_blank" rel="noopener noreferrer">
          Hack Club Slack
        </a>{' '}
        and quote the reference below.
      </p>

      <div className="action-row">
        <button onClick={() => unstable_retry()} className="action action-strong">
          Try again
        </button>
        <Link href="/" className="action">
          Back to smol
        </Link>
      </div>

      {/* The reference and the build, together — one is useless without the other. */}
      <p className="edition" style={{ marginTop: '20px' }}>
        {error.digest ? `REF ${error.digest} · ` : ''}
        {editionLine()}
      </p>
    </main>
  )
}
