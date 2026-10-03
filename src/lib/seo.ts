import type { Metadata } from 'next'
import type { Job, RecruitmentEvent } from '@/types'
import { SITE_URL } from '@/config/api'

// No manual default OG image — the file-based app/opengraph-image.tsx is applied
// automatically by Next to every route, so we only set images when overriding it.

export function generateJobMetadata(job: Job): Metadata {
  const title = `${job.title} di ${job.company} | CDC Universitas Stekom`
  const description = `Lamar ${job.title} di ${job.company}, ${job.location}${job.salary ? `. Gaji ${job.salary}` : ''}. Lowongan ${job.employmentType} terbaru ${new Date().getFullYear()}.`
  const url = `${SITE_URL}/job/${job.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      // opengraph-image.tsx co-located in /job/[slug]/ auto-generates dynamic OG
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: job.expiresAt && new Date(job.expiresAt) < new Date()
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

export function generateListingMetadata(opts: {
  title: string
  description: string
  path: string
  noIndex?: boolean
}): Metadata {
  const url = `${SITE_URL}${opts.path}`
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      type: 'website',
      // images omitted → Next applies the dynamic app/opengraph-image.tsx
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}

export function generateEventMetadata(event: RecruitmentEvent): Metadata {
  const title = `${event.title} | CDC Universitas Stekom`
  const description = `Daftarkan diri ke ${event.title} di ${event.location}. ${event.description.slice(0, 120)}...`
  const url = `${SITE_URL}/event/${event.slug}`
  // Poster rekrutmen offline ada di galeri, bukan banner.
  const ogImage = event.banner ?? event.gallery?.[0]

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      // Use the event banner when available; otherwise Next's dynamic OG applies.
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
