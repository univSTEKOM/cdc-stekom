import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, MapPin, Users, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { generateListingMetadata } from '@/lib/seo'
import { JsonLd } from '@/components/shared/JsonLd'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { fetchEvents } from '@/services/events.service'
import { isRegistrationOpen } from '@/lib/events'
import { breadcrumbSchema } from '@/lib/schema'

export const revalidate = 3600

export const metadata: Metadata = generateListingMetadata({
  title: 'Virtual Job Fair (VJF) Universitas STEKOM | Semua Batch',
  description:
    'Daftar seluruh batch Virtual Job Fair CDC Universitas Stekom. Bertemu rekruter dari ratusan perusahaan secara online. Gratis untuk semua peserta.',
  path: '/event/vjf',
})

const crumbs = [
  { label: 'Beranda', href: '/' },
  { label: 'Event', href: '/event' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtRange(start: string, end?: string) {
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }
  if (!e || s.toDateString() === e.toDateString()) return s.toLocaleDateString('id-ID', opt)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  if (sameMonth) {
    return `${s.getDate()}–${e.toLocaleDateString('id-ID', opt)}`
  }
  return `${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} – ${e.toLocaleDateString('id-ID', opt)}`
}

export default async function VJFPage() {
  const events = await fetchEvents()
  const vjfBatches = events
    .filter((e) => e.type === 'vjf')
    .sort((a, b) => b.batch - a.batch) // newest first

  const upcoming = vjfBatches.filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
  const past     = vjfBatches.filter((e) => e.status === 'past')

  return (
    <>
      <JsonLd schema={breadcrumbSchema([...crumbs, { label: 'Virtual Job Fair', href: '/event/vjf' }])} />

      {/* Hero */}
      <section className="border-b border-border bg-brand-bg">
        <div className="site-container py-10">
          <Breadcrumbs crumbs={crumbs} currentLabel="Virtual Job Fair" />
          <Badge className="mt-4 bg-primary/10 text-primary hover:bg-primary/10 border-0">
            Virtual Job Fair
          </Badge>
          <h1 className="mt-2 text-3xl font-bold text-brand-text sm:text-4xl">
            Virtual Job Fair CDC Universitas Stekom
          </h1>
          <p className="mt-3 text-brand-muted max-w-2xl">
            Bertemu langsung dengan rekruter dari ratusan perusahaan secara online. Sesi interview, presentasi perusahaan, dan penawaran kerja — semua dari rumahmu.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-brand-muted">
              <CalendarDays className="h-4 w-4 text-primary" />
              {vjfBatches.length} Batch Diselenggarakan
            </span>
            <span className="flex items-center gap-1.5 text-brand-muted">
              <CheckCircle2 className="h-4 w-4 text-cta" />
              Gratis untuk semua peserta
            </span>
          </div>
        </div>
      </section>

      <div className="site-container py-10 space-y-10">

        {/* Upcoming batches */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-brand-text mb-5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Batch Mendatang
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => {
                const companyCount = ev.jobs?.length ?? 0
                const deadline = ev.registrationDeadline
                  ? fmtDate(ev.registrationDeadline)
                  : null
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border-2 border-primary bg-white p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-primary text-white hover:bg-primary border-0 shrink-0">
                        Batch {ev.batch}
                      </Badge>
                      {/* Label mengikuti tanggal, bukan status yang ditulis tangan. */}
                      {ev.status === 'ongoing' ? (
                        <span className="text-[11px] font-semibold text-white bg-cta rounded-full px-2.5 py-0.5">
                          Sedang Berlangsung
                        </span>
                      ) : isRegistrationOpen(ev) ? (
                        <span className="text-[11px] font-medium text-cta bg-cta/10 rounded-full px-2.5 py-0.5">
                          Pendaftaran Dibuka
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-brand-muted bg-muted rounded-full px-2.5 py-0.5">
                          Pendaftaran Ditutup
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-brand-text leading-snug">{ev.title}</p>
                      <p className="mt-1 text-xs text-brand-muted line-clamp-2">{ev.intro ?? ev.description}</p>
                    </div>

                    <div className="space-y-1.5 text-sm text-brand-muted">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {fmtRange(ev.date, ev.endDate)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {ev.location}
                      </span>
                      {companyCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                          {companyCount} perusahaan hadir
                        </span>
                      )}
                    </div>

                    {deadline && (
                      <p className="text-xs text-brand-muted border-t border-border pt-2.5">
                        Batas daftar: <span className="font-medium text-brand-text">{deadline}</span>
                      </p>
                    )}

                    <Link href={`/event/${ev.slug}`} className="mt-auto">
                      <Button className="w-full cursor-pointer" size="sm">
                        Daftar Sekarang
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Past batches */}
        {past.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-brand-text mb-5">
              Riwayat Batch
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((ev) => {
                const companyCount = ev.jobs?.length ?? 0
                return (
                  <Link
                    key={ev.id}
                    href={`/event/${ev.slug}`}
                    className="group rounded-xl border border-border bg-white p-5 flex flex-col gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-muted text-brand-muted hover:bg-muted border-0 shrink-0">
                        Batch {ev.batch}
                      </Badge>
                      <span className="text-[11px] text-brand-muted">Selesai</span>
                    </div>

                    <div>
                      <p className="font-semibold text-brand-text leading-snug group-hover:text-primary transition-colors">
                        {ev.title}
                      </p>
                    </div>

                    <div className="space-y-1 text-sm text-brand-muted">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {fmtRange(ev.date, ev.endDate)}
                      </span>
                      {companyCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          {companyCount} perusahaan
                        </span>
                      )}
                    </div>

                    <span className="mt-auto text-xs font-medium text-primary group-hover:underline flex items-center gap-1">
                      Lihat detail <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {vjfBatches.length === 0 && (
          <p className="text-brand-muted text-sm">Belum ada batch VJF yang dijadwalkan.</p>
        )}
      </div>
    </>
  )
}
