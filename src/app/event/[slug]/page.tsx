import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CalendarDays, MapPin, Clock, Users, Building2, Briefcase,
  Bookmark, CheckCircle2, ChevronDown, ArrowRight, Video, Store, ImageIcon,
  FileText, Info, CirclePlay, Mic, ExternalLink, type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { generateEventMetadata } from '@/lib/seo'
import { eventSchema, breadcrumbSchema } from '@/lib/schema'
import { JsonLd } from '@/components/shared/JsonLd'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { JobCard } from '@/components/shared/JobCard'
import { InstagramEmbed } from '@/components/shared/InstagramEmbed'
import { VJFRegistrationForm } from '@/features/forms/VJFRegistrationForm'
import { Announcement } from '@/features/events/Announcement'
import { EventShareButtons } from '@/features/events/EventShareButtons'
import { OfflineRegisterButtons } from '@/features/events/OfflineRegisterButtons'
import { SITE_URL } from '@/config/api'
import type { RecruitmentEvent } from '@/types'
import { fetchEventBySlug, fetchEvents } from '@/services/events.service'
export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

// Waktu event disimpan UTC tapi selalu ditampilkan dalam WIB, dipaksa lewat
// timeZone agar tidak ikut zona server (container deploy jalan di UTC).
const WIB = 'Asia/Jakarta'

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString('id-ID', { ...opts, timeZone: WIB })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: WIB,
  })
}

function isSameDay(a: string, b: string) {
  const day = (iso: string) =>
    new Date(iso).toLocaleDateString('en-CA', { timeZone: WIB })
  return day(a) === day(b)
}

const STATUS: Record<RecruitmentEvent['status'], { label: string; className: string }> = {
  upcoming: { label: 'Akan Datang', className: 'bg-cta/10 text-cta' },
  ongoing: { label: 'Berlangsung Hari Ini', className: 'bg-cta text-white' },
  past: { label: 'Selesai', className: 'bg-muted text-brand-muted' },
}

// Event sejenis dengan nomor batch terdekat (yang lebih baru menang bila seri).
function relatedEvents(all: RecruitmentEvent[], event: RecruitmentEvent, n = 3) {
  return all
    .filter((e) => e.type === event.type && e.slug !== event.slug)
    .sort((a, b) =>
      Math.abs(a.batch - event.batch) - Math.abs(b.batch - event.batch) || b.batch - a.batch,
    )
    .slice(0, n)
}

// Ikon link acara VJF berdasarkan labelnya.
function linkIcon(label: string): LucideIcon {
  if (/zoom meeting/i.test(label)) return Video
  if (/youtube|live/i.test(label)) return CirclePlay
  if (/booth/i.test(label)) return Store
  if (/background|poster/i.test(label)) return ImageIcon
  if (/brosur|beasiswa/i.test(label)) return FileText
  return Info
}

// Poster menulis posisi sebagai "Nama (Jenjang)"; keterangan dalam kurung
// dipisah supaya bisa tampil sebagai baris kedua yang lebih redup.
function splitPosition(pos: string) {
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(pos)
  return m ? { name: m[1], note: m[2] } : { name: pos, note: undefined }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)
  if (!event) return { title: 'Event tidak ditemukan' }
  return generateEventMetadata(event)
}

export async function generateStaticParams() {
  const events = await fetchEvents()
  return events.map((e) => ({ slug: e.slug }))
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const event = await fetchEventBySlug(slug)
  if (!event) notFound()
  const related = relatedEvents(await fetchEvents(), event)

  const isVjf = event.type === 'vjf'
  const isPast = event.status === 'past'
  const timeRange = event.endDate && isSameDay(event.date, event.endDate)
    ? `${fmtTime(event.date)} - ${fmtTime(event.endDate)} WIB`
    : undefined
  const regLinks = !isPast ? event.registrationLinks ?? [] : []
  // Ada versi terstruktur dari pengumuman → teks aslinya cukup dilipat.
  const hasStructured = Boolean(
    event.intro || event.positions?.length || event.requirements?.length || event.eventLinks?.length,
  )
  // Teks asli untuk "Baca selengkapnya": pengumuman offline, atau deskripsi VJF.
  const fullText = event.announcement ?? (isVjf ? event.description : undefined)
  // API VJF mengisi lokasi "Indonesia"; acaranya sendiri lewat Zoom.
  const location = isVjf && /^indonesia$/i.test(event.location) ? 'Online via Zoom' : event.location
  // Batas daftar di hari acara itu sendiri tidak memberi info baru.
  const showDeadline = event.registrationDeadline && !isSameDay(event.registrationDeadline, event.date)

  const crumbs = [
    { label: 'Beranda', href: '/' },
    { label: 'Event', href: '/event' },
    {
      label: isVjf ? 'Virtual Job Fair' : 'Rekrutmen Offline',
      href: isVjf ? '/event/vjf' : '/event/offline-recruitment',
    },
  ]
  const listHref = crumbs[2].href

  const relatedCard = (
    <div className="rounded-xl border border-border bg-background p-5">
      <h2 className="mb-2 text-sm font-bold text-brand-text">Batch Lainnya</h2>
      <ul className="-mx-2">
        {related.map((e) => (
          <li key={e.id}>
            <Link
              href={`/event/${e.slug}`}
              className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-brand-bg"
            >
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-bg text-brand-text group-hover:bg-white">
                <span className="text-sm font-bold leading-none">{fmt(e.date, { day: 'numeric' })}</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase text-brand-muted">{fmt(e.date, { month: 'short' })}</span>
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-medium leading-snug text-brand-text group-hover:text-cta">
                  {e.title}
                </span>
                {e.batch > 0 && <span className="text-xs text-brand-muted">Batch {e.batch}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )

  // Tanggal, jam, lokasi: dipakai di sidebar VJF maupun rekrutmen offline.
  const summary = (
    <>
      <div className="flex items-center gap-4 border-b border-border p-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-cta text-white">
          <span className="text-2xl font-extrabold leading-none">{fmt(event.date, { day: 'numeric' })}</span>
          <span className="mt-1 text-[11px] font-semibold uppercase">{fmt(event.date, { month: 'short' })}</span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-brand-text">
            {fmt(event.date, { weekday: 'long' })}, {fmt(event.date, { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {timeRange && <p className="mt-0.5 text-sm text-brand-muted">{timeRange}</p>}
        </div>
      </div>

      <dl className="space-y-3 p-5 text-sm">
        <div className="flex gap-3">
          <dt className="sr-only">Lokasi</dt>
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cta" aria-hidden="true" />
          <dd className="text-brand-text">{location}</dd>
        </div>
        {event.capacity && (
          <div className="flex gap-3">
            <dt className="sr-only">Kapasitas</dt>
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-cta" aria-hidden="true" />
            <dd className="text-brand-text">Kapasitas {event.capacity}</dd>
          </div>
        )}
        {event.category && (
          <div className="flex gap-3">
            <dt className="sr-only">Kategori</dt>
            <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-cta" aria-hidden="true" />
            <dd className="text-brand-text">{event.category}</dd>
          </div>
        )}
      </dl>
    </>
  )
  const eventUrl = `${SITE_URL}/event/${event.slug}`

  return (
    <>
      <JsonLd schema={eventSchema(event)} />
      <JsonLd schema={breadcrumbSchema([...crumbs, { label: event.title, href: `/event/${event.slug}` }])} />

      {/* Header */}
      <section className="border-b border-border bg-brand-bg">
        <div className="site-container pt-8 pb-10">
          <Breadcrumbs crumbs={crumbs} currentLabel={event.title} />

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={`border-0 ${isVjf ? 'bg-primary/10 text-primary hover:bg-primary/10' : 'bg-cta/10 text-cta hover:bg-cta/10'}`}
                >
                  {isVjf ? 'Virtual Job Fair' : 'Rekrutmen Offline'}
                </Badge>
                {event.batch > 0 && (
                  <Badge variant="outline" className="bg-white text-brand-text">
                    Batch {event.batch}
                  </Badge>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[event.status].className}`}>
                  {STATUS[event.status].label}
                </span>
              </div>

              <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-brand-text sm:text-4xl">
                {event.title}
              </h1>

              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-muted">
                <li className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-cta" aria-hidden="true" />
                  {fmt(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {/* Event multi-hari (VJF) menampilkan tanggal akhir. */}
                  {event.endDate && !timeRange &&
                    ` s.d. ${fmt(event.endDate, { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </li>
                {timeRange && (
                  <li className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-cta" aria-hidden="true" />
                    {timeRange}
                  </li>
                )}
                <li className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-cta" aria-hidden="true" />
                  {location}
                </li>
                {isVjf && (
                  <li className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-cta" aria-hidden="true" />
                    {event.organizer}
                  </li>
                )}
                {event.jobs && (
                  <li className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-cta" aria-hidden="true" />
                    {event.jobs.length} perusahaan
                  </li>
                )}
              </ul>

              {showDeadline && event.registrationDeadline && (
                <p className="mt-3 text-sm font-medium text-cta">
                  Pendaftaran hingga {fmt(event.registrationDeadline, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}

              {/* Di mobile sidebar jatuh ke bawah konten panjang; tombol daftar
                  utama dinaikkan ke sini supaya tidak perlu digulir. */}
              {isVjf && !isPast && (
                <a
                  href="#daftar"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cta px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-dark active:scale-[0.98] lg:hidden"
                >
                  Daftar Sekarang
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              {regLinks.length > 0 && (
                <OfflineRegisterButtons
                  eventTitle={event.title}
                  eventUrl={eventUrl}
                  links={regLinks}
                  className="mt-5 grid gap-2 sm:grid-cols-2 lg:hidden"
                />
              )}
            </div>

            <EventShareButtons url={eventUrl} title={event.title} />
          </div>
        </div>
      </section>

      <div className="site-container py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-10">
            {event.banner && (
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-border bg-muted sm:aspect-video">
                <Image
                  src={event.banner}
                  alt={`Poster ${event.title}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-contain"
                />
              </div>
            )}

            {event.intro && (
              <div className="max-w-[65ch] space-y-3 text-base leading-relaxed text-brand-text/80">
                {event.intro.split('\n\n').map((p) => <p key={p}>{p}</p>)}
              </div>
            )}

            {event.requirements && event.requirements.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">Siapa yang Bisa Ikut</h2>
                <ul className="space-y-2 rounded-xl bg-brand-bg p-5">
                  {event.requirements.map((r) => (
                    <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-brand-text">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cta" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {event.stats && event.stats.length > 0 && (
              <dl className="grid grid-cols-2 divide-border rounded-xl border border-border sm:flex sm:divide-x">
                {event.stats.map((st) => (
                  <div key={st.label} className="flex-1 px-5 py-4">
                    <dd className="text-2xl font-extrabold tracking-tight text-brand-text">{st.value}</dd>
                    <dt className="mt-0.5 text-xs text-brand-muted">{st.label}</dt>
                  </div>
                ))}
              </dl>
            )}

            {event.benefits && event.benefits.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">Yang Kamu Dapat</h2>
                <ul className="grid gap-2 rounded-xl bg-brand-bg p-5 sm:grid-cols-2">
                  {event.benefits.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-brand-text">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cta" aria-hidden="true" />
                      {b}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {event.speakers && event.speakers.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">Pembicara</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {event.speakers.map((sp) => (
                    <li key={sp.name} className="flex gap-3 rounded-xl border border-border bg-white px-4 py-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                        <Mic className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold text-cta">{sp.role}</span>
                        <span className="block text-sm font-semibold leading-snug text-brand-text">{sp.name}</span>
                        {sp.title && <span className="block text-xs text-brand-muted">{sp.title}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {event.eventLinks && event.eventLinks.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">Link Acara</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {event.eventLinks.map((l) => {
                    const Icon = linkIcon(l.label)
                    return (
                      <li key={l.url}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex h-full items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 transition-colors hover:border-cta"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold leading-snug text-brand-text group-hover:text-cta">{l.label}</span>
                            <span className="block truncate text-xs text-brand-muted">
                              {l.note ?? l.url.replace(/^https?:\/\//, '')}
                            </span>
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-brand-muted group-hover:text-cta" aria-hidden="true" />
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {(event.hostedBy || event.companyContact) && (
              <div className="max-w-[65ch] space-y-2 text-sm leading-relaxed text-brand-muted">
                {event.hostedBy && (
                  <p><span className="font-semibold text-brand-text">Penyelenggara:</span> {event.hostedBy}</p>
                )}
                {event.companyContact && (
                  <p>
                    Perusahaan ingin membuka booth?{' '}
                    <a href={event.companyContact.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-cta hover:underline">
                      {event.companyContact.label}
                    </a>
                  </p>
                )}
              </div>
            )}

            {event.positions && event.positions.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-brand-text">
                  Posisi Tersedia
                  <span className="rounded-full bg-cta/10 px-2 py-0.5 text-xs font-semibold text-cta">
                    {event.positions.length}
                  </span>
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {event.positions.map((pos) => {
                    const { name, note } = splitPosition(pos)
                    return (
                      <li
                        key={pos}
                        className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                          <Briefcase className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-snug text-brand-text">{name}</span>
                          {note && <span className="block text-xs text-brand-muted">{note}</span>}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}

            {event.gallery && event.gallery.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">
                  {event.gallery.length === 1 ? 'Poster Acara' : 'Galeri Dokumentasi'}
                </h2>
                {/* Satu gambar = poster, tampil utuh (tidak di-crop) supaya
                    tulisannya terbaca. Lebih dari satu = grid foto. */}
                <div className={event.gallery.length === 1 ? 'max-w-md' : 'grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3'}>
                  {event.gallery.map((src, i) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buka foto ${i + 1} ukuran penuh`}
                      className={`group relative block overflow-hidden rounded-xl border border-border bg-muted ${event.gallery!.length === 1 ? 'aspect-4/5' : 'aspect-square'}`}
                    >
                      <Image
                        src={src}
                        alt={`${event.title}, foto ${i + 1}`}
                        fill
                        sizes={event.gallery!.length === 1 ? '(max-width: 640px) 100vw, 448px' : '(max-width: 640px) 50vw, 250px'}
                        className={`transition-transform duration-300 group-hover:scale-[1.03] ${event.gallery!.length === 1 ? 'object-contain' : 'object-cover'}`}
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {event.instagramUrl && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">Pengumuman di Instagram</h2>
                <div className="max-w-md overflow-hidden rounded-xl border border-border">
                  <InstagramEmbed url={event.instagramUrl} />
                </div>
              </section>
            )}

            {/* Teks pengumuman asli: dilipat bila sudah ada versi terstruktur,
                ditampilkan langsung bila parsing tidak menemukan apa pun. */}
            {fullText && (hasStructured ? (
              <details className="group max-w-3xl rounded-xl border border-border">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-brand-text [&::-webkit-details-marker]:hidden">
                  {isVjf ? 'Baca deskripsi lengkap' : 'Baca pengumuman lengkap'}
                  <ChevronDown className="h-4 w-4 text-brand-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-border px-5 py-5">
                  <Announcement text={fullText} />
                </div>
              </details>
            ) : (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">Deskripsi Acara</h2>
                <Announcement text={fullText} />
              </section>
            ))}

            {!fullText && event.description && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-brand-text">Tentang Event</h2>
                <p className="max-w-[65ch] whitespace-pre-line text-sm leading-relaxed text-brand-muted">
                  {event.description}
                </p>
              </section>
            )}

            {event.jobs && event.jobs.length > 0 && (
              <section>
                <h2 className="mb-5 text-lg font-bold text-brand-text">Lowongan dalam Event</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {event.jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
                <Separator className="mt-10" />
              </section>
            )}
          </div>

          {/* Sidebar: VJF pakai form sendiri; rekrutmen offline mendaftar lewat
              link resmi di poster, jadi tidak ada form di sini. */}
          <aside className="w-full">
            {isVjf ? (
              <div className="sticky top-20 space-y-4">
                <div className="rounded-xl border border-border bg-background">{summary}</div>
                <div id="daftar" className="scroll-mt-24 rounded-xl border border-border bg-background p-6">
                  {isPast ? (
                    <>
                      <p className="text-sm font-semibold text-brand-text">Acara ini sudah selesai</p>
                      <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                        Virtual Job Fair diadakan rutin. Cek jadwal batch berikutnya.
                      </p>
                      <Link
                        href={listHref}
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-dark active:scale-[0.98]"
                      >
                        Lihat Jadwal Batch
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <h2 className="mb-1 text-lg font-bold text-brand-text">Daftar Sekarang</h2>
                      <p className="mb-5 text-sm text-brand-muted">Gratis untuk semua peserta</p>
                      <VJFRegistrationForm eventId={event.id} eventTitle={event.title} />
                    </>
                  )}
                </div>
                {related.length > 0 && relatedCard}
              </div>
            ) : (
              <div className="sticky top-20 space-y-4">
                {/* Ringkasan acara + aksi utama */}
                <div className="rounded-xl border border-border bg-background">
                  {summary}

                  {regLinks.length > 0 && (
                    <div className="border-t border-border p-5">
                      <OfflineRegisterButtons
                        eventTitle={event.title}
                        eventUrl={eventUrl}
                        links={regLinks}
                        className="space-y-2.5"
                      />
                      <p className="pt-3 text-center text-xs text-brand-muted">Gratis untuk semua peserta</p>
                    </div>
                  )}

                  {isPast && (
                    <div className="border-t border-border p-5">
                      <p className="text-sm font-semibold text-brand-text">Acara ini sudah selesai</p>
                      <p className="mt-1 text-sm leading-relaxed text-brand-muted">
                        Rekrutmen offline diadakan hampir setiap minggu. Cek jadwal batch berikutnya.
                      </p>
                      <Link
                        href={listHref}
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cta-dark active:scale-[0.98]"
                      >
                        Lihat Jadwal Batch
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  )}
                </div>

                {!isPast && (
                  <div className="rounded-xl bg-brand-bg p-5 text-sm text-brand-muted">
                    <p className="font-semibold text-brand-text">Yang perlu dibawa</p>
                    <p className="mt-1.5 leading-relaxed">
                      Bawa CV, fotokopi ijazah, dan kartu identitas. Datang 30 menit
                      sebelum acara dimulai.
                    </p>
                  </div>
                )}

                {related.length > 0 && relatedCard}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  )
}
