import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, CalendarDays, Clock, MapPin,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { JobCard } from '@/components/shared/JobCard'
import { HeroSearch } from '@/features/jobs/HeroSearch'
import { PaperPlane } from '@/features/jobs/PaperPlane'
import { fetchJobs, fetchCategories, fetchLocations } from '@/services/jobs.service'
import { fetchEvents } from '@/services/events.service'
import { seoUrl } from '@/lib/seo-urls'

export const revalidate = 3600


const QUICK_FILTERS = [
  { label: 'Fresh Graduate', href: seoUrl.employmentType('full-time') },
  { label: 'Magang', href: seoUrl.employmentType('magang') },
  { label: 'Full Time', href: seoUrl.employmentType('full-time') },
  { label: 'Part Time', href: seoUrl.employmentType('part-time') },
  { label: 'Freelance', href: seoUrl.employmentType('freelance') },
]

const PERKS = [
  'Setiap hari mendapat premium akses ke 1.000 lowongan kerja terbaru',
  'Relasi perusahaan super banyak, lebih dari 500.000 perusahaan se-Indonesia',
  'Setiap hari ada Live TikTok lowongan kerja dan tips karir',
  'Setiap minggu ada rekrutmen dari perusahaan besar, bisa offline maupun online',
  'Setiap minggu ada Pelatihan HRD, pengembangan skill kerja dan kesiapan karir',
  'Setiap bulan rutin ada JOBFAIR Nasional bersama perusahaan ternama',
  'Seluruh mahasiswa berbudaya bisa kuliah sambil bekerja, bisa kerja sambil kuliah',
  'Lulus sudah punya pengalaman kerja, bukan hanya ijazah saja',
]

export default async function HomePage() {
  const [{ jobs: latestJobs }, categories, locations, events] = await Promise.all([
    fetchJobs({ perPage: 6 }),
    fetchCategories(),
    fetchLocations(),
    fetchEvents(),
  ])

  const offlineEvents = events.filter((e) => e.type === 'offline')
  const vjfEvents = events.filter((e) => e.type === 'vjf')

  // "Lainnya" adalah keranjang sisa terbesar di API (272rb dari 579rb baris) —
  // sebagai kartu ia hanya mengambil tempat tanpa memberi tahu isinya apa.
  // Sisanya pas 18 kategori, tepat tiga baris penuh di grid enam kolom.
  // fetchCategories() sudah mengurutkan menurun berdasarkan jumlah loker.
  const homeCategories = categories.filter((c) => c.slug !== 'lainnya').slice(0, 18)

  return (
    <>
      {/* ── Hero Search ── */}
      <section className="relative bg-primary border-b border-primary">
        {/* Decorative layer — overflow clipped here, not on section, so dropdown can escape */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Right: hero image */}
          <div className="hidden lg:block absolute inset-y-0 right-0 w-[44%]">
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-primary to-transparent z-10" />
            <Image
              src="/images/hero/hero.webp"
              alt="Mahasiswa siap berkarir bersama CDC Universitas Stekom"
              fill
              sizes="44vw"
              quality={82}
              className="object-cover object-center brightness-[1.03] contrast-[1.08] saturate-[1.18] [image-rendering:high-quality]"
              priority
            />
          </div>
          {/* Paper plane animation */}
          <div className="hidden lg:block absolute top-6 z-20" style={{ right: 'calc(44% + 8px)' }}>
            <PaperPlane />
          </div>
        </div>

        {/* Left: text + search */}
        <div className="relative z-10 site-container">
          <div className="py-12 lg:py-14 lg:max-w-[58%]">
            <Badge className="mb-4 bg-white/20 text-white hover:bg-white/20 border-0">
              Portal Karir Resmi Universitas STEKOM
            </Badge>
            <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-[2.75rem] leading-tight">
              Temukan Pekerjaan yang
              <br /> Tepat untuk Anda
            </h1>
            <p className="mt-3 text-base text-white/75 max-w-lg">
              Ratusan lowongan dari perusahaan terpercaya. Daftar gratis, lamar langsung tanpa perantara.
            </p>

            <div className="mt-7">
              <HeroSearch locations={locations} categories={categories} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_FILTERS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20 hover:text-white cursor-pointer"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Lowongan Terbaru ── */}
      <section className="site-container py-12">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-text">Lowongan Terbaru</h2>
            <p className="mt-1 text-sm text-brand-muted">Diperbarui setiap hari dari perusahaan terverifikasi</p>
          </div>
          <Link
            href="/loker"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline cursor-pointer"
          >
            Lihat semua <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Filter chips */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { label: 'Semua', href: '/loker' },
            { label: 'Full Time', href: seoUrl.employmentType('full-time') },
            { label: 'Magang', href: seoUrl.employmentType('magang') },
            { label: 'Part Time', href: seoUrl.employmentType('part-time') },
            { label: 'Freelance', href: seoUrl.employmentType('freelance') },
          ].map(({ label, href }, i) => (
            <Link
              key={label}
              href={href}
              className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                i === 0
                  ? 'bg-primary text-white'
                  : 'border border-border bg-white text-brand-muted hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {/* Maksimal 3 kolom: dengan 6 kartu, grid 4 kolom menyisakan baris kedua
            yang cuma terisi dua. Tiga kolom selalu terisi penuh (3+3), begitu
            pula dua kolom (2+2+2) dan satu kolom. */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {latestJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/loker"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-7 py-2.5 text-sm font-medium text-brand-muted transition-all hover:border-primary hover:text-primary cursor-pointer"
          >
            Lihat Semua Lowongan
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Kategori Pekerjaan ── */}
      <section className="bg-brand-bg border-y border-border">
        <div className="site-container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-text">Kategori Pekerjaan</h2>
            <Button variant="ghost" render={<Link href="/kategori" />} className="cursor-pointer text-primary gap-1">
              Semua kategori <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {homeCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={seoUrl.category(cat.slug)}
                className="group rounded-xl border border-border bg-white px-4 py-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
              >
                <p className="font-semibold text-brand-text group-hover:text-primary transition-colors">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lokasi Populer ── */}
      <section className="bg-brand-bg">
        <div className="site-container py-12">
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Berdasarkan Kota</p>
              <h2 className="text-2xl font-bold text-brand-text">Loker di Kota Populer</h2>
            </div>
            <Link
              href="/daerah"
              className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Lihat semua kota <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {locations.slice(0, 10).map((loc) => (
              <Link
                key={loc.slug}
                href={seoUrl.location(loc.slug)}
                className="group rounded-xl border border-border bg-white px-4 py-5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
              >
                <p className="font-semibold text-brand-text group-hover:text-primary transition-colors">{loc.name}</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 sm:hidden flex justify-center">
            <Link
              href="/daerah"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Lihat semua kota <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Event Rekrutmen — promo banners ── */}
      {(offlineEvents.length > 0 || vjfEvents.length > 0) && (
        <section className="site-container py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-text">Event Rekrutmen</h2>
            <Button variant="ghost" render={<Link href="/event" />} className="cursor-pointer text-primary gap-1">
              Semua event <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {/* VJF — solid primary blue */}
            <div className="relative rounded-2xl overflow-hidden bg-primary flex min-h-[220px]">
              <div className="flex-1 flex flex-col justify-center gap-4 p-8 z-10">
                <Badge className="w-fit bg-white/20 text-white border-0 hover:bg-white/20 text-xs">
                  Virtual Job Fair
                </Badge>
                <h3 className="text-xl font-bold text-white leading-snug max-w-[260px]">
                  Bertemu ratusan rekruter langsung dari rumah
                </h3>
                {vjfEvents[0] && (
                  <p className="text-sm text-white/70 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {new Date(vjfEvents[0].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <Button
                  render={<Link href="/event/vjf" />}
                  className="cursor-pointer w-fit bg-white text-primary hover:bg-white/90 font-semibold px-6"
                >
                  Daftar Sekarang
                </Button>
              </div>
              {/* Right image */}
              <div className="hidden sm:block w-[42%] relative shrink-0">
                <Image
                  src="/images/event-vjf.webp"
                  alt="Virtual Job Fair: sesi rekrutmen online via Zoom"
                  fill
                  sizes="(max-width: 640px) 0px, 42vw"
                  className="object-cover object-left"
                />
                {/* dark-to-transparent overlay so text stays readable at small widths */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-primary to-transparent" />
              </div>
            </div>

            {/* Rekrutmen — light bg + orange */}
            <div className="relative rounded-2xl overflow-hidden bg-brand-bg border border-border flex min-h-[220px]">
              <div className="flex-1 flex flex-col justify-center gap-4 p-8 z-10">
                <Badge className="w-fit bg-orange-100 text-orange-700 border-0 hover:bg-orange-100 text-xs">
                  Rekrutmen
                </Badge>
                <h3 className="text-xl font-bold text-brand-text leading-snug max-w-[260px]">
                  Ikut seleksi langsung di kampus atau daftar online
                </h3>
                {offlineEvents[0] && (
                  <p className="text-sm text-brand-muted flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {new Date(offlineEvents[0].date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <Button
                  render={<Link href="/event/rekrutmen" />}
                  className="cursor-pointer w-fit bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6"
                >
                  Daftar Rekrutmen
                </Button>
              </div>
              {/* Right image */}
              <div className="hidden sm:block w-[42%] relative shrink-0">
                <Image
                  src="/images/event-offline.webp"
                  alt="Rekrutmen: peserta dan panitia di aula seleksi"
                  fill
                  sizes="(max-width: 640px) 0px, 42vw"
                  className="object-cover object-[center_100%]"
                />
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-brand-bg to-transparent" />
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ── Banner Eksklusif Penunjang Karir & Usaha ── */}
      <section className="relative overflow-hidden bg-primary text-white">
        {/* decorative glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 right-0 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl" />
        </div>

        <div className="relative site-container py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Eksklusif Penunjang <span className="text-orange-300">Karir dan Usaha</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/85 sm:text-base">
              Kuliah di Universitas STEKOM bukan sekadar belajar. Ini semua yang kamu
              dapatkan sebagai mahasiswa untuk siap kerja dan berkarir.
            </p>
          </div>

          {/* stat strip */}
          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-3 divide-x divide-white/15 rounded-2xl bg-white/10 py-5 backdrop-blur ring-1 ring-white/15">
            {[
              { value: '1.000+', label: 'Lowongan / hari' },
              { value: '500K+', label: 'Perusahaan mitra' },
              { value: 'Nasional', label: 'Jobfair tiap bulan' },
            ].map(({ value, label }) => (
              <div key={label} className="px-2 text-center">
                <dt className="text-xl font-extrabold sm:text-2xl">{value}</dt>
                <dd className="mt-1 text-[11px] uppercase tracking-wide text-white/70 sm:text-xs">{label}</dd>
              </div>
            ))}
          </dl>

          <ul className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-x-8 gap-y-2 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-4">
            {PERKS.map((text) => (
              <li
                key={text}
                className="flex items-start gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-white/10"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-300" aria-hidden="true" />
                <span className="text-sm leading-relaxed text-white/90 sm:text-base">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col items-center gap-3">
            <Button
              size="lg"
              render={<Link href="https://kew.stekom.ac.id/?utm_source=cdc&utm_medium=banner&utm_campaign=daftar_kuliah" target="_blank" rel="noopener noreferrer" />}
              className="group cursor-pointer bg-white px-8 font-bold text-primary shadow-xl transition-colors duration-200 hover:bg-orange-50"
            >
              Daftar Kuliah Sekarang
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </Button>
            <p className="text-xs text-white/70">Kuliah sambil kerja, lulus langsung siap berkarir</p>
          </div>
        </div>
      </section>
    </>
  )
}
