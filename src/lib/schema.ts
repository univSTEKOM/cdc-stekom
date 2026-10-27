import type { Job, RecruitmentEvent, Crumb } from '@/types'
import { SITE_URL } from '@/config/api'

export function jobPostingSchema(job: Job): object {
  // Google requires a non-empty addressLocality inside jobLocation; when the
  // location is unknown, fall back to applicantLocationRequirements (country)
  // instead of emitting an invalid empty Place.
  const locationField = job.location
    ? {
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.location,
            addressCountry: 'ID',
          },
        },
      }
    : {
        jobLocationType: 'TELECOMMUTE',
        applicantLocationRequirements: { '@type': 'Country', name: 'Indonesia' },
      }

  const validThrough = job.expiresAt ?? defaultValidThrough(job.postedAt)

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company,
      value: job.id,
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      ...(job.companyLogo ? { logo: job.companyLogo } : {}),
    },
    ...locationField,
    employmentType: mapEmploymentType(job.employmentTypeSlug),
    // datePosted is required by Google, but emitting an invalid value is worse
    // than omitting it — a zero-dated row simply carries no posting date.
    ...(job.postedAt ? { datePosted: job.postedAt } : {}),
    // Google requires validThrough; default to 30 days after posting when absent.
    ...(validThrough ? { validThrough } : {}),
    ...(job.salary ? { baseSalary: parseSalary(job.salary) } : {}),
    directApply: true,
    url: `${SITE_URL}/job/${job.slug}`,
    ...(job.skills.length ? { skills: job.skills.join(', ') } : {}),
  }
}

// JobPosting without validThrough triggers a Google warning; jobs from the CDC
// API have no expiry, so assume a 30-day window from the posting date.
function defaultValidThrough(postedAt?: string): string | undefined {
  if (!postedAt) return undefined
  const d = new Date(postedAt)
  // Guard the epoch too: toISOString() throws RangeError on an Invalid Date,
  // which would take down the whole page render rather than just the schema.
  if (Number.isNaN(d.getTime())) return undefined
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

function mapEmploymentType(slug: string): string {
  const map: Record<string, string> = {
    'full-time': 'FULL_TIME',
    'part-time': 'PART_TIME',
    magang: 'INTERN',
    freelance: 'CONTRACTOR',
    kontrak: 'CONTRACTOR',
  }
  return map[slug] ?? 'OTHER'
}

function parseSalary(salary: string): object {
  const match = salary.match(/[\d.]+/g)
  if (!match || match.length < 1) return {}
  const min = parseInt(match[0].replace(/\./g, ''))
  const max = match[1] ? parseInt(match[1].replace(/\./g, '')) : min
  return {
    '@type': 'MonetaryAmount',
    currency: 'IDR',
    value: {
      '@type': 'QuantitativeValue',
      minValue: min,
      maxValue: max,
      unitText: 'MONTH',
    },
  }
}

export function eventSchema(event: RecruitmentEvent): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.date,
    ...(event.endDate ? { endDate: event.endDate } : {}),
    location: event.type === 'vjf'
      ? { '@type': 'VirtualLocation', url: `${SITE_URL}/event/${event.slug}` }
      : { '@type': 'Place', name: event.location },
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
      url: SITE_URL,
    },
    url: `${SITE_URL}/event/${event.slug}`,
    eventStatus: 'https://schema.org/EventScheduled',
    // Rekrutmen yang punya link "Daftar Hadir Online" bisa diikuti dari dua jalur.
    eventAttendanceMode: event.type === 'vjf'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : event.registrationLinks?.some((l) => /online/i.test(l.label))
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
  }
}

export function breadcrumbSchema(crumbs: Crumb[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${SITE_URL}${c.href}`,
    })),
  }
}

export function itemListSchema(jobs: Job[], pageUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: pageUrl,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/job/${job.slug}`,
      name: `${job.title} — ${job.company}`,
    })),
  }
}

export function faqPageSchema(faqs: { q: string; a: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

export function organizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CDC Universitas Stekom',
    alternateName: 'Career Development Center Universitas STEKOM',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: 'Career Development Center resmi Universitas STEKOM, menghubungkan pencari kerja dengan peluang karir terbaik.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jl. Majapahit No.605',
      addressLocality: 'Semarang',
      addressRegion: 'Jawa Tengah',
      postalCode: '50272',
      addressCountry: 'ID',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'pmbdigital@stekom.ac.id',
      contactType: 'customer support',
      areaServed: 'ID',
      availableLanguage: 'Indonesian',
    },
    sameAs: [
      'https://www.stekom.ac.id',
    ],
  }
}

export function websiteSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CDC Universitas Stekom, Portal Karir',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/loker?keyword={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}
