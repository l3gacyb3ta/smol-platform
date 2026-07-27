import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

/** Only the landing page is public; every other route sits behind Hack Club auth. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
