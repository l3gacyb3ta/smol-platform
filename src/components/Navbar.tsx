'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'

interface NavbarProps {
  variant: 'public' | 'admin'
}

export default function Navbar({ variant }: NavbarProps) {
  const { data: session } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0" style={{ height: '68px' }}>
      <Link href={variant === 'admin' ? '/dashboard' : '/'} className="flex items-center gap-3">
        <svg width="121" height="68" viewBox="0 0 121 68" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Hack Club">
          <rect width="121" height="68" fill="#ec3750"/>
          <text x="8" y="26" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="11" fill="white" letterSpacing="0.5">HACK</text>
          <text x="8" y="40" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="11" fill="white" letterSpacing="0.5">CLUB</text>
          <path d="M70 10 Q80 5 90 12 Q95 8 100 14 Q105 10 108 18 Q110 25 105 30 Q108 35 103 40 Q98 44 92 42 Q88 48 82 46 Q76 50 72 44 Q66 46 64 40 Q60 34 63 28 Q60 22 65 16 Z" fill="white" opacity="0.9"/>
          <circle cx="95" cy="18" r="3" fill="#ec3750"/>
        </svg>
        {variant === 'admin' && (
          <span className="font-heading text-hc-dark text-lg font-extrabold">Smol Admin</span>
        )}
      </Link>

      {session ? (
        <div className="flex items-center gap-3">
          {session.user?.name && (
            <span className="text-sm text-gray-500 font-medium">{session.user.name}</span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="bg-hc-red text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-red-600 transition-colors cursor-pointer"
            style={{ boxShadow: '0 0 2.35px rgba(236,55,80,0.71)' }}
          >
            Log Out
          </button>
        </div>
      ) : (
        <button
          onClick={() => signIn('hackclub', { callbackUrl: '/dashboard' })}
          className="bg-hc-red text-white px-5 py-1.5 rounded-full text-sm font-bold hover:bg-red-600 transition-colors cursor-pointer"
          style={{ boxShadow: '0 0 2.35px rgba(236,55,80,0.71)' }}
        >
          Log In
        </button>
      )}
    </nav>
  )
}
