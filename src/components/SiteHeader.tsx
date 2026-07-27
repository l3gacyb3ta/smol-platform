'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'

/**
 * The whole of the site chrome: the mark, who you are, and the one route worth
 * having from everywhere. No sticky positioning and no backdrop blur; each page
 * still states where it sits with a crumb.
 *
 * The way back to the program list used to be missing exactly where it was
 * needed. The "Your programs" link only rendered on the public variant, so on
 * every logged-in page the header offered no route to it — and reaching it from,
 * say, a submissions queue meant two crumbs. The wordmark quietly pointed at
 * `/dashboard` instead of `/` on those routes, which made it one click, but
 * nothing said so: the same element went to different places depending on where
 * you already were, which is a hidden mode rather than navigation.
 *
 * So now the wordmark always means home, and "All programs" is a labelled action
 * next to your name. Two destinations, both stated.
 */
export default function SiteHeader() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // A link to the page you are already on is noise, and the dashboard is the one
  // place this button cannot usefully go.
  const onDashboard = pathname === '/dashboard'

  return (
    <header className="site-header">
      <Link href="/" className="site-mark">
        {/* Orpheus at its native 280:158 ratio — squashing it into a square is
            what made it unreadable. */}
        <Image
          src="/flag-orpheus-top.svg"
          alt="Hack Club"
          width={280}
          height={158}
          priority
          unoptimized
        />
        <span className="wordmark">smol</span>
        {/* Your role, stated. This used to read "organizer" on every logged-in
            page regardless of who you were — a label for the route, not the
            person. Whether you're an admin decided four things in this app and
            was only discoverable by noticing a button that hadn't appeared. */}
        {session && <span className="role">{session.user?.isAdmin ? 'admin' : 'organizer'}</span>}
      </Link>

      <div className="site-session">
        {status === 'loading' ? (
          <span className="edition working">checking…</span>
        ) : session ? (
          <>
            {session.user?.name && <span className="tally">{session.user.name}</span>}
            {!onDashboard && (
              <Link href="/dashboard" className="action">
                All programs
              </Link>
            )}
            <button onClick={() => signOut({ callbackUrl: '/' })} className="action">
              Log out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn('hackclub', { callbackUrl: '/dashboard' })}
            className="action"
          >
            Log in with Hack Club
          </button>
        )}
      </div>
    </header>
  )
}
