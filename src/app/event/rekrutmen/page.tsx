import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, MapPin, Building2, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
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
  title: 'Rekrutmen Universitas STEKOM | Jadwal Semua Batch',
  description:
    'Jadwal seluruh batch Rekrutmen CDC Universitas STEKOM. Ikuti seleksi langsung di kampus atau secara online, gratis untuk semua peserta.',
  path: '/event/rekrutmen',
})

const crumbs = [
  { label: 'Beranda', href: '/' },
  { label: 'Event', href: '/event' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default async function RecruitmentPage() {
  const events = await fetchEvents()
  const batches = events
    .filter((e) => e.type === 'offline')
    .sort((a, b) => b.batch - a.batch) // newest first

  const upcoming = batches.filter((e) => e.status === 'upcoming' || e.status === 'ongoing')
  const past     = batches.filter((e) => e.status === 'past')

  return (
    <>
      <JsonLd schema={breadcrumbSchema([...crumbs, { label: 'Rekrutmen', href: '/event/rekrutmen' }])} />

      {/* Hero */}
      <section className="border-b border-border bg-brand-bg">
        <div className="site-container py-10">
          <Breadcrumbs crumbs={crumbs} currentLabel="Rekrutmen" />
          <Badge className="mt-4 bg-cta/10 text-cta hover:bg-cta/10 border-0">
            Rekrutmen
          </Badge>
          <h1 className="mt-2 text-3xl font-bold text-brand-text sm:text-4xl">
            Rekrutmen Perusahaan di Universitas STEKOM
          </h1>
          <p className="mt-3 text-brand-muted max-w-2xl">
            Perusahaan membuka seleksi bersama CDC Universitas STEKOM hampir setiap minggu. Pilih cara ikut yang paling pas: datang langsung ke kampus atau daftar online, lalu jalani seleksi dengan rekruternya.
          </p>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-brand-muted">
              <CalendarDays className="h-4 w-4 text-cta" />
              {batches.length} Batch Diselenggarakan
            </span>
            <span className="flex items-center gap-1.5 text-brand-muted">
              <CheckCircle2 className="h-4 w-4 text-cta" />
              Gratis untuk semua peserta
            </span>
            <span className="flex items-center gap-1.5 text-brand-muted">
              <MapPin className="h-4 w-4 text-cta" />
              Hadir di kampus atau online
            </span>
          </div>
        </div>
      </section>

      <div className="site-container py-10 space-y-10">

        {/* Upcoming batches */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-brand-text mb-5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cta" />
              Batch Mendatang
            </h2>
            <div className="grid gap-5 lg:grid-cols-2">
              {upcoming.map((ev) => {
                const companies = [...new Set(ev.jobs?.map((j) => j.company) ?? [])]
                const deadline = ev.registrationDeadline ? fmtDateShort(ev.registrationDeadline) : null
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border-2 border-cta bg-white p-6 flex flex-col gap-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-cta text-white hover:bg-cta border-0 shrink-0">
                        Batch {ev.batch}
                      </Badge>
                      {/* Label mengikuti tanggal, bukan status yang ditulis tangan. */}
                      {ev.status === 'ongoing' ? (
                        <span className="text-[11px] font-semibold text-white bg-cta rounded-full px-2.5 py-0.5">
                          Berlangsung Hari Ini
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
                      <p className="font-semibold text-brand-text text-lg leading-snug">{ev.title}</p>
                      <p className="mt-1 text-sm text-brand-muted">{ev.description}</p>
                    </div>

                    {/* Companies */}
                    {companies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-brand-text mb-2 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-cta" />
                          Perusahaan yang Hadir
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {companies.map((c) => (
                            <span
                              key={c}
                              className="rounded-full border border-border bg-brand-bg px-3 py-1 text-xs font-medium text-brand-text"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info */}
                    <div className="space-y-1.5 text-sm text-brand-muted">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-cta" />
                        {fmtDate(ev.date)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-cta" />
                        {ev.location}
                      </span>
                    </div>

                    {deadline && (
                      <p className="text-xs text-brand-muted border-t border-border pt-3">
                        Batas daftar: <span className="font-medium text-brand-text">{deadline}</span>
                      </p>
                    )}

                    <Link href={`/event/${ev.slug}`} className="mt-auto">
                      <Button className="w-full cursor-pointer bg-cta hover:bg-cta/90" size="sm">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((ev) => {
                const companies = [...new Set(ev.jobs?.map((j) => j.company) ?? [])]
                return (
                  <Link
                    key={ev.id}
                    href={`/event/${ev.slug}`}
                    className="group rounded-xl border border-border bg-white p-5 flex flex-col gap-3 hover:border-cta/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge className="bg-muted text-brand-muted hover:bg-muted border-0 shrink-0">
                        Batch {ev.batch}
                      </Badge>
                      <span className="text-[11px] text-brand-muted">Selesai</span>
                    </div>

                    <p className="font-semibold text-brand-text leading-snug group-hover:text-cta transition-colors">
                      {ev.title}
                    </p>

                    {/* Companies */}
                    {companies.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-brand-muted mb-1.5 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Perusahaan
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {companies.map((c) => (
                            <span
                              key={c}
                              className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-brand-muted"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-sm text-brand-muted space-y-1">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        {fmtDateShort(ev.date)}
                      </span>
                    </div>

                    <span className="mt-auto text-xs font-medium text-cta group-hover:underline flex items-center gap-1">
                      Lihat detail <ChevronRight className="h-3 w-3" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {batches.length === 0 && (
          <p className="text-brand-muted text-sm">Belum ada rekrutmen yang dijadwalkan.</p>
        )}
      </div>
    </>
  )
}
