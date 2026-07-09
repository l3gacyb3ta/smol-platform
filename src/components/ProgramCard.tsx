import type { ReactNode } from 'react'
import type { Program } from '@/lib/types'

export function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface ProgramCardProps {
  program: Program
  badge?: ReactNode
  children: ReactNode
  className?: string
}

export function ProgramCard({ program, badge, children, className = '' }: ProgramCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 flex flex-col gap-4 ${className}`}
      style={{
        border: `1.5px solid ${program.keyColor}33`,
        boxShadow: `0 4px 12px ${hexToRgba(program.keyColor, 0.1)}, 0 2px 4px rgba(0,0,0,0.06)`,
      }}
    >
      <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: program.keyColor }} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className="text-hc-dark text-xl font-bold leading-tight"
            style={{ fontFamily: 'var(--font-recursive)', fontVariationSettings: '"CASL" 1, "CRSV" 0.5, "MONO" 0' }}
          >
            {program.name}
          </h3>
          <p className="text-gray-500 text-sm font-medium leading-relaxed mt-1">
            {program.description}
          </p>
        </div>
        {badge != null && <div className="shrink-0">{badge}</div>}
      </div>

      {children}
    </div>
  )
}
