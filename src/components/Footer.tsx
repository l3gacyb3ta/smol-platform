import Link from 'next/link'
import Image from 'next/image'
import Wordmark from './Wordmark'

const LINKS = [
  { label: 'Hack Club', href: 'https://hackclub.com' },
  { label: 'All YSWS programs', href: 'https://ysws.hackclub.com' },
  { label: 'Join the Slack', href: 'https://hackclub.com/slack/' },
  { label: 'Source', href: 'https://github.com/l3gacyb3ta/smol-platform' },
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex">
            <Wordmark />
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Tiny You Ship We Ship programs, run by teenagers at Hack Club. Build
            something, show it off, get something real in the mail.
          </p>
          <a
            href="https://hackclub.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block transition-opacity hover:opacity-80"
          >
            {/* Native ratio is 280×158; kept wide enough for the wordmark to read. */}
            <Image
              src="/flag-orpheus-top.svg"
              alt="Hack Club"
              width={280}
              height={158}
              className="h-auto w-[150px]"
            />
          </a>
        </div>

        <nav className="flex flex-col gap-2.5 sm:items-end">
          {LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-500 transition-colors hover:text-hc-red"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-100">
        <p className="mx-auto w-full max-w-5xl px-6 py-4 text-xs text-gray-400">
          Made with love at Hack Club. Ship well.
        </p>
      </div>
    </footer>
  )
}
