import type { InputHTMLAttributes } from 'react'

/**
 * A fill-in-the-blank inside a sentence.
 *
 * The label is never rendered — the words around the blank say what it is, which
 * is the whole point of writing configuration as a sentence — so it goes to
 * `aria-label` instead, and the surrounding prose has to be good enough that
 * sighted readers get the same information.
 */
export default function Blank({
  label,
  size = 'wide',
  ...props
}: {
  label: string
  size?: 'wide' | 'date' | 'slug' | 'count'
  // `size` shadows the HTML attribute of the same name on purpose — a blank is
  // sized by the class, and the numeric character-count attribute would fight it.
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size'>) {
  return <input {...props} aria-label={label} className={`blank blank-${size}`} />
}
