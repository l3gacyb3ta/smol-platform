'use client'

import { useRouter } from 'next/navigation'

export default function DeleteButton({ programId, programName }: { programId: string; programName: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`Delete "${programName}"? This cannot be undone.`)) return
    await fetch(`/api/programs/${programId}`, { method: 'DELETE' })
    router.push('/dashboard')
  }

  return (
    <button
      onClick={handleDelete}
      className="bg-hc-red text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
      style={{ fontFamily: 'var(--font-recursive)' }}
    >
      Delete Program
    </button>
  )
}
