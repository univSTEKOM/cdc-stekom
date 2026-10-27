import Link from 'next/link'
import type { Metadata } from 'next'
import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateListingMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { JsonLd } from '@/components/shared/JsonLd'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { fetchEvents } from '@/services/events.service'
export const revalidate = 3600

export const metadata: Metadata = generateListingMetadata({
  title: 'Event Rekrutmen & Job Fair | CDC Universitas Stekom',
  description:
    'Virtual Job Fair dan Rekrutmen dari CDC Universitas Stekom. Daftarkan diri, offline maupun online, dan temukan peluang karir langsung dari rekruter.',
  path: '/event',
})

const crumbs = [{ label: 'Beranda', href: '/' }]

export default async function EventPage() {
  const events = await fetchEvents()

  return (
    <>
      <JsonLd schema={breadcrumbSchema([...crumbs, { label: 'Event', href: '/event' }])} />

      <div className="border-b border-border bg-brand-bg">
        <div className="site-container py-6">
          <Breadcrumbs crumbs={crumbs} currentLabel="Event Rekrutmen" />
          <h1 className="mt-2 text-2xl font-bold text-brand-text sm:text-3xl">
            Event Rekrutmen
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            Virtual Job Fair dan Rekrutmen dari CDC Universitas Stekom
          </p>
        </div>
      </div>

      <div className="site-container py-8">
        {/* Quick links */}
        <div className="grid grid-cols-1 gap-4 mb-10 sm:grid-cols-2">
          <Link
            href="/event/vjf"
            className="group flex gap-4 rounded-lg border-2 border-primary/30 bg-primary/5 p-6 transition-all duration-200 hover:border-primary cursor-pointer"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-brand-text group-hover:text-primary transition-colors">
                Virtual Job Fair (VJF)
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Bertemu rekruter dari rumah. Daftar dan jelajahi booth virtual ratusan perusahaan.
              </p>
            </div>
          </Link>

          <Link
            href="/event/rekrutmen"
            className="group flex gap-4 rounded-lg border-2 border-cta/30 bg-cta/5 p-6 transition-all duration-200 hover:border-cta cursor-pointer"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cta/10">
              <MapPin className="h-6 w-6 text-cta" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-brand-text group-hover:text-cta transition-colors">
                Rekrutmen
              </h2>
              <p className="mt-1 text-sm text-brand-muted">
                Seleksi langsung dengan rekruter perusahaan. Ikut di kampus Universitas STEKOM atau daftar online.
              </p>
            </div>
          </Link>
        </div>

        {/* Event list */}
        <h2 className="text-xl font-bold text-brand-text mb-4">Jadwal Event</h2>
        {events.length === 0 ? (
          <p className="text-brand-muted">Belum ada event yang dijadwalkan.</p>
        ) : (
          <div className="space-y-4">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={`/event/${ev.slug}`}
                className="group flex gap-5 rounded-lg border border-border bg-background p-5 transition-all duration-200 hover:border-primary hover:shadow-sm cursor-pointer"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CalendarDays className="h-7 w-7 text-primary" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {ev.type === 'vjf' ? 'Virtual Job Fair' : 'Rekrutmen'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-brand-text group-hover:text-primary transition-colors">
                    {ev.title}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-brand-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {new Date(ev.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {ev.location}
                    </span>
                  </div>
                  {ev.registrationDeadline && (
                    <p className="mt-1 text-xs text-cta font-medium">
                      Pendaftaran hingga {new Date(ev.registrationDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
                <Button size="sm" className="cursor-pointer shrink-0 self-center bg-primary text-white hidden sm:flex">
                  Daftar
                </Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
