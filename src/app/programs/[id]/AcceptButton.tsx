'use client'

import { useRouter } from 'next/navigation'

export default function AcceptButton({ programId }: { programId: string }) {
  const router = useRouter()

  async function handleAccept() {
    await fetch(`/api/programs/${programId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={handleAccept}
      className="bg-green-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
      style={{ fontFamily: 'var(--font-recursive)' }}
    >
      Accept Program ✓
    </button>
  )
}
