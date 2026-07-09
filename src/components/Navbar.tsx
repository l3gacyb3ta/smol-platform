'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signIn, signOut } from 'next-auth/react'

interface NavbarProps {
  variant: 'public' | 'admin'
}

export default function Navbar({ variant }: NavbarProps) {
  const { data: session } = useSession()

  return (
    <nav className="bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0" style={{ height: '68px' }}>
      <Link href={variant === 'admin' ? '/dashboard' : '/'} className="flex items-center gap-3">
        <Image src="/flag-orpheus-top.svg" alt="Smol Flag" width={150} height={150} />
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
