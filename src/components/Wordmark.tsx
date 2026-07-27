/** The smol lockup: a red tile plus the wordmark. */
export default function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="font-heading flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-hc-red pb-0.5 text-lg leading-none font-extrabold text-white">
        s
      </span>
      <span className="font-display text-xl leading-none font-extrabold text-hc-dark">smol</span>
    </span>
  )
}
