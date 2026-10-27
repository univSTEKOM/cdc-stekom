import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { seoUrl } from '@/lib/seo-urls'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-[#0F172A]">
      <div className="site-container py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-white cursor-pointer">
              <Briefcase className="h-5 w-5" aria-hidden="true" />
              CDC Universitas Stekom
            </Link>
            <p className="mt-3 text-sm text-[#CBD5E1] leading-relaxed">
              Career Development Center Universitas STEKOM. Menghubungkan pencari kerja dengan peluang karir terbaik.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Pencari Kerja</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#CBD5E1]">
              <li><Link href="/loker" className="hover:text-white transition-colors duration-200 cursor-pointer">Semua Lowongan</Link></li>
              {/* Link to the canonical facet URLs directly — /tipe-pekerjaan/* is
                  only a legacy redirect, and pointing sitewide links at it wasted
                  a hop on every crawl. */}
              <li><Link href={seoUrl.employmentType('full-time')} className="hover:text-white transition-colors duration-200 cursor-pointer">Full Time</Link></li>
              <li><Link href={seoUrl.employmentType('part-time')} className="hover:text-white transition-colors duration-200 cursor-pointer">Part Time</Link></li>
              <li><Link href={seoUrl.employmentType('magang')} className="hover:text-white transition-colors duration-200 cursor-pointer">Magang</Link></li>
              <li><Link href={seoUrl.employmentType('freelance')} className="hover:text-white transition-colors duration-200 cursor-pointer">Freelance</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Event Rekrutmen</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#CBD5E1]">
              <li><Link href="/event" className="hover:text-white transition-colors duration-200 cursor-pointer">Semua Event</Link></li>
              <li><Link href="/event/vjf" className="hover:text-white transition-colors duration-200 cursor-pointer">Virtual Job Fair</Link></li>
              <li><Link href="/event/rekrutmen" className="hover:text-white transition-colors duration-200 cursor-pointer">Rekrutmen</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-[#CBD5E1]">
          <p>© {year} Career Development Center Universitas STEKOM. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
