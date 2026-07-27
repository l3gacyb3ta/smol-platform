import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { editionLine } from '@/lib/edition'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <main className="sheet sheet-form" style={{ paddingTop: '48px' }}>
      <Link href="/" className="site-mark">
        <Wordmark />
      </Link>

      <h1>Nothing at this address</h1>
      <p>
        The program may have been deleted, the link may have a typo in it, or it may be a program you
        can&apos;t see — smol answers all three the same way on purpose, so the page can&apos;t be
        used to work out which record IDs are real.
      </p>

      <div className="action-row">
        <Link href="/" className="action action-strong">
          Back to smol
        </Link>
        <Link href="/dashboard" className="action">
          Your programs
        </Link>
      </div>

      <p className="edition" style={{ marginTop: '20px' }}>
        HTTP 404 · {editionLine()}
      </p>
    </main>
  )
}
