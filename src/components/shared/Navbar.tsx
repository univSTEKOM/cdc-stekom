'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRight, CalendarDays, ChevronDown, Menu, MapPin, X } from 'lucide-react'

const NAV_LINKS = [
  // Logo memang menuju "/", tapi itu tidak jelas sebagai navigasi — terutama di
  // menu mobile yang tidak menampilkan logo sama sekali.
  { label: 'Beranda', href: '/' },
  { label: 'Cari Lowongan', href: '/loker' },
  { label: 'Kategori', href: '/kategori' },
  { label: 'Lokasi', href: '/daerah' },
]

// Dikelompokkan di bawah "Event" supaya navbar tidak penuh oleh tiap jenis acara.
const EVENT_LINKS = [
  {
    label: 'Virtual Job Fair',
    href: '/event/vjf',
    description: 'Ketemu ratusan rekruter dari rumah via Zoom',
    Icon: CalendarDays,
  },
  {
    label: 'Rekrutmen',
    href: '/event/rekrutmen',
    description: 'Seleksi langsung di kampus atau daftar online',
    Icon: MapPin,
  },
]

// lucide-react tidak menyertakan ikon brand, jadi logo WhatsApp digambar inline.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.15c-1.53 0-3.03-.41-4.34-1.19l-.31-.18-3.22.84.86-3.14-.2-.32a8.23 8.23 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.24-8.24s8.24 3.7 8.24 8.24-3.7 8.38-8.21 8.38zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  )
}

// Kontak CDC untuk perusahaan yang ingin memasang loker / kerja sama.
// 0888-8555-582 → format internasional tanpa "+" sesuai wa.me.
const PARTNER_WA = '628888555582'
const PARTNER_WA_TEXT =
  'Halo CDC Universitas STEKOM, saya dari perusahaan dan ingin bekerja sama / memasang lowongan kerja.'
const PARTNER_WA_URL = `https://wa.me/${PARTNER_WA}?text=${encodeURIComponent(PARTNER_WA_TEXT)}`

function isActive(pathname: string, href: string) {
  if (href.includes('#')) return false
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

// Terbuka saat hover (desktop) maupun klik (layar sentuh/keyboard).
function EventMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = pathname.startsWith('/event')

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`relative flex items-center gap-1 px-3 py-2 text-[13px] font-medium rounded-md transition-colors duration-150 cursor-pointer ${
          active
            ? 'text-primary'
            : 'text-brand-muted hover:text-brand-text hover:bg-muted'
        }`}
      >
        Event
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        {active && (
          <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
        )}
      </button>

      {open && (
        // pt-2 menjembatani celah ke tombol supaya hover tidak putus.
        <div className="absolute left-0 top-full pt-2">
          <div className="w-72 rounded-xl border border-border bg-white p-2 shadow-lg">
            {EVENT_LINKS.map(({ label, href, description, Icon }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex gap-3 rounded-lg p-3 transition-colors hover:bg-muted ${
                  isActive(pathname, href) ? 'bg-primary/5' : ''
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-brand-text">{label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-brand-muted">{description}</span>
                </span>
              </Link>
            ))}
            <Link
              href="/event"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-between rounded-lg border-t border-border px-3 pb-2 pt-3 text-xs font-medium text-primary hover:underline"
            >
              Lihat semua event
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-border">
      <div className="site-container flex h-16 items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center cursor-pointer shrink-0"
          aria-label="CDC Universitas Stekom, Halaman Utama"
        >
          <Image
            src="/logo.png"
            alt="STEKOM Career Development"
            width={180}
            height={44}
            className="h-9 w-auto object-contain"
            priority
            unoptimized
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Navigasi utama">
          {NAV_LINKS.map(({ label, href }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={label}
                href={href}
                className={`relative px-3 py-2 text-[13px] font-medium rounded-md transition-colors duration-150 ${
                  active
                    ? 'text-primary'
                    : 'text-brand-muted hover:text-brand-text hover:bg-muted'
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
          <EventMenu pathname={pathname} />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Tujuannya WhatsApp, bukan halaman — pakai <a> biasa. Ikon WA yang
              menandai kanalnya supaya user tidak terkejut saat WhatsApp terbuka. */}
          <a
            href={PARTNER_WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary/90 cursor-pointer"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            Untuk Perusahaan
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-brand-muted hover:bg-muted transition-colors cursor-pointer"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="lg:hidden border-t border-border bg-white">
          <nav className="site-container py-3 flex flex-col gap-0.5" aria-label="Navigasi mobile">
            {NAV_LINKS.map(({ label, href }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-primary/8 text-primary'
                      : 'text-brand-muted hover:text-brand-text hover:bg-muted'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
            <p className="mt-2 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wider text-brand-muted/70">
              Event
            </p>
            {EVENT_LINKS.map(({ label, href, Icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? 'bg-primary/8 text-primary'
                      : 'text-brand-muted hover:text-brand-text hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
            <div className="mt-2 pt-3 border-t border-border">
              <a
                href={PARTNER_WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Untuk Perusahaan
              </a>
              <p className="mt-2 text-center text-xs text-brand-muted">
                Pasang loker / kerja sama — hubungi CDC via WhatsApp
              </p>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
