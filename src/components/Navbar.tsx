'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn, signOut } from 'next-auth/react'
import { SpinnerIcon } from './Icons'

interface NavbarProps {
  variant: 'public' | 'admin'
}

export default function Navbar({ variant }: NavbarProps) {
  const { data: session, status } = useSession()

  return (
    <nav className="sticky top-0 z-40 shrink-0 border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={variant === 'admin' ? '/dashboard' : '/'}
          className="flex shrink-0 items-center gap-2.5"
        >
          {/* Orpheus flag at its native 280:158 ratio — squashing it into a
              square is what made it unreadable before. */}
          <Image
            src="/flag-orpheus-top.svg"
            alt="Hack Club"
            width={280}
            height={158}
            priority
            className="h-12 w-auto sm:h-14"
          />
          <span className="font-display text-xl leading-none font-extrabold text-hc-dark">
            smol
          </span>
          {variant === 'admin' && (
            <span className="badge badge-gray ml-0.5 hidden sm:inline-flex">admin</span>
          )}
        </Link>

        {status === 'loading' ? (
          <SpinnerIcon size={16} className="text-gray-300" />
        ) : session ? (
          <div className="flex items-center gap-3">
            {variant === 'public' && (
              <Link href="/dashboard" className="btn btn-secondary btn-sm hidden sm:inline-flex">
                Dashboard
              </Link>
            )}
            {session.user?.name && (
              <span className="hidden text-sm font-medium text-gray-500 sm:inline">
                {session.user.name}
              </span>
            )}
            <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn-ghost btn-sm">
              Log out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('hackclub', { callbackUrl: '/dashboard' })}
            className="btn btn-primary btn-sm"
          >
            <span>Log in</span>
            <span className="hidden sm:inline">with Hack Club</span>
          </button>
        )}
      </div>
    </nav>
  )
}
