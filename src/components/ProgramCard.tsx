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

/**
 * Shared shell for a program tile. The program's key colour shows up as a top
 * strip and a faint tint in the border and shadow, so cards stay
 * distinguishable at a glance without shouting.
 */
export function ProgramCard({ program, badge, children, className = '' }: ProgramCardProps) {
  return (
    <div
      className={`card relative flex h-full flex-col overflow-hidden ${className}`}
      style={{
        borderColor: hexToRgba(program.keyColor, 0.22),
        boxShadow: `0 1px 2px rgba(17,24,39,0.04), 0 6px 20px ${hexToRgba(program.keyColor, 0.1)}`,
      }}
    >
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: program.keyColor }} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-casual text-xl leading-tight font-bold text-hc-dark">
              {program.name}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500 line-clamp-2">
              {program.description}
            </p>
          </div>
          {badge != null && <div className="shrink-0">{badge}</div>}
        </div>

        {children}
      </div>
    </div>
  )
}
