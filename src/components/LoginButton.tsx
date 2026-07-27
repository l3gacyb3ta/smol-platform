'use client'

import { signIn } from 'next-auth/react'

/** Kicks off Hack Club OAuth. Used for calls-to-action outside the navbar. */
export default function LoginButton({
  children,
  className = 'btn btn-primary btn-lg',
  callbackUrl = '/dashboard',
}: {
  children: React.ReactNode
  className?: string
  callbackUrl?: string
}) {
  return (
    <button onClick={() => signIn('hackclub', { callbackUrl })} className={className}>
      {children}
    </button>
  )
}
