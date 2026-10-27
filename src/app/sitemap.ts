import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/config/api'
import { fetchCategories, fetchLocations, fetchTipeKerja } from '@/services/jobs.service'
import { getCdcSitemapEntries, sitemapSlug, assertApiReachable } from '@/services/cdc-loker.service'
import { fetchEvents } from '@/services/events.service'
import { seoUrl } from '@/lib/seo-urls'

// Google caps a single sitemap at 50k URLs. The corpus is ~570k listings, so the
// job sitemap is split across JOB_SHARDS shards of JOBS_PER_SHARD each, newest
// first — shard ids run 1..JOB_SHARDS.
const JOBS_PER_SHARD = 5000
const JOB_SHARDS = 20

// 0 = static, 1..JOB_SHARDS = jobs, then taxonomy, then events.
const TAXONOMY_ID = JOB_SHARDS + 1
const EVENTS_ID = JOB_SHARDS + 2

/**
 * Every sitemap id this route emits, in order. robots.txt imports this instead
 * of hardcoding a list — the two drifted before (robots advertised ids 0-3 while
 * the taxonomy and event shards actually sit at 21 and 22), which left ~555k
 * listings and every facet page unannounced to search engines.
 */
export const SITEMAP_IDS: number[] = [
  0,
  ...Array.from({ length: JOB_SHARDS }, (_, i) => i + 1),
  TAXONOMY_ID,
  EVENTS_ID,
]

export async function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }))
}

// Next 16 passes `id` as a promise resolving to a string (it was a plain number
// up to v15) — it must be awaited before use, or every branch below sees NaN and
// the shard renders empty.
export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const sid = Number(await props.id)

  if (sid === 0) {
    return [
      { url: SITE_URL,                                   lastModified: now, changeFrequency: 'daily',  priority: 1.0 },
      { url: `${SITE_URL}/loker`,                        lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
      { url: `${SITE_URL}/daerah`,                       lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${SITE_URL}/kategori`,                     lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
      { url: `${SITE_URL}/event`,                        lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${SITE_URL}/event/vjf`,                    lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${SITE_URL}/event/rekrutmen`,    lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    ]
  }

  // ── Job shards: use the lightweight sitemap feed (4 fields/row) ──
  if (sid >= 1 && sid <= JOB_SHARDS) {
    const { entries } = await getCdcSitemapEntries(sid, JOBS_PER_SHARD)
    // The first shard always has data when the API is up; an empty one means the
    // fetch fell back. Fail the build rather than publishing an empty sitemap.
    if (sid === 1) assertApiReachable()
    return entries.map((e) => ({
      url: `${SITE_URL}/job/${sitemapSlug(e)}`,
      lastModified: new Date(e.updated_at ?? e.tanggal),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  }

  if (sid === TAXONOMY_ID) {
    const [categories, locations, tipeKerja] = await Promise.all([
      fetchCategories(),
      fetchLocations(),
      fetchTipeKerja(),
    ])

    // Counts come from the API, so a non-zero count already means the facet has
    // live listings — no need to cross-check against a fetched page of jobs.
    const categoryRoutes: MetadataRoute.Sitemap = categories
      .filter((c) => c.count > 0)
      .map((c) => ({ url: `${SITE_URL}${seoUrl.category(c.slug)}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 }))

    const locationRoutes: MetadataRoute.Sitemap = locations
      .filter((l) => l.count > 0)
      .map((l) => ({ url: `${SITE_URL}${seoUrl.location(l.slug)}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 }))

    const tipeRoutes: MetadataRoute.Sitemap = tipeKerja
      .filter((t) => t.count > 0)
      .map((t) => ({ url: `${SITE_URL}${seoUrl.employmentType(t.slug)}`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.7 }))

    // Category × location combinations are a large cross-product; emit only the
    // busiest of each so the sitemap stays well under the 50k URL cap and does
    // not advertise thin pages.
    const topCategories = categories.filter((c) => c.count > 0).slice(0, 20)
    const topLocations = locations.filter((l) => l.count > 0).slice(0, 60)
    const combinedRoutes: MetadataRoute.Sitemap = []
    for (const cat of topCategories) {
      for (const loc of topLocations) {
        combinedRoutes.push({
          url: `${SITE_URL}${seoUrl.combined(cat.slug, loc.slug)}`,
          lastModified: now,
          changeFrequency: 'daily' as const,
          priority: 0.65,
        })
      }
    }

    return [...categoryRoutes, ...locationRoutes, ...tipeRoutes, ...combinedRoutes]
  }

  if (sid === EVENTS_ID) {
    const events = await fetchEvents()
    return events.map((e) => ({
      url: `${SITE_URL}/event/${e.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))
  }

  return []
}
