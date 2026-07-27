import { editionLine } from '@/lib/edition'

const LINKS = [
  { label: 'Hack Club', href: 'https://hackclub.com' },
  { label: 'Every YSWS program', href: 'https://ysws.hackclub.com' },
  { label: 'Join the Slack', href: 'https://hackclub.com/slack/' },
  { label: 'Source', href: 'https://github.com/l3gacyb3ta/smol-platform' },
]

/**
 * Four links and the edition line. The edition line is the point: it names the
 * form and the build, so "which version were you looking at" is answerable.
 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="sheet">
        <ul className="footer-links">
          {LINKS.map(({ label, href }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </li>
          ))}
        </ul>
        <p className="edition">{editionLine()} · MADE AT HACK CLUB · SHIP WELL</p>
      </div>
    </footer>
  )
}
