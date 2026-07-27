import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Everything behind auth is noise for crawlers.
      disallow: ['/dashboard', '/programs/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
