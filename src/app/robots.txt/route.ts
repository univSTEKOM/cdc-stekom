import { SITE_URL } from '@/config/api'
import { SITEMAP_IDS } from '../sitemap'

/**
 * robots.txt disusun sebagai Route Handler, bukan lewat objek
 * `MetadataRoute.Robots`.
 *
 * Alasannya: tipe RobotsFile Next hanya mengenal userAgent/allow/disallow/
 * crawlDelay/sitemap/host, sehingga direktif `Content-Signal` tidak bisa
 * disisipkan lewat jalur itu. Menulisnya sebagai file statis juga bukan pilihan
 * — daftar sitemap harus ikut SITEMAP_IDS secara otomatis, dan pernah terjadi
 * daftar yang di-hardcode diam-diam basi saat jumlah shard berubah.
 */

const DISALLOW = [
  '/api/',
  '/search',
  // Parameter kueri hanya memvariasikan urutan/penyaringan dari halaman yang
  // sama — merayapinya hanya menghabiskan crawl budget tanpa URL baru.
  '/*?page=',
  '/*?sort=',
  '/*?salary=',
  '/*?experience=',
  '/*?keyword=',
  '/*?category=',
  '/*?location=',
  '/*?tipe=',
]

/**
 * Content Signals — pernyataan izin pemakaian konten oleh crawler.
 *
 *   search=yes    → indeks pencarian tetap diizinkan (inti dari portal ini).
 *   ai-input=yes  → konten boleh dipakai menjawab pertanyaan AI real-time.
 *                   Diizinkan dengan sengaja: pencari kerja makin sering
 *                   bertanya lewat asisten AI, dan menolaknya berarti menutup
 *                   jalur penemuan yang sedang tumbuh.
 *   ai-train=no   → tidak untuk melatih atau fine-tune model.
 *
 * Tanpa baris ini, preamble Content Signals yang panjang itu hanya legenda:
 * tidak ada preferensi yang dinyatakan, sehingga statusnya netral — bukan
 * opt-out seperti yang mudah disalahpahami.
 */
const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=no'

export function GET(): Response {
  const body = [
    'User-Agent: *',
    `Content-Signal: ${CONTENT_SIGNAL}`,
    'Allow: /',
    ...DISALLOW.map((path) => `Disallow: ${path}`),
    '',
    // generateSitemaps() menyajikan sitemap tersegmen di /sitemap/{id}.xml —
    // tidak ada route /sitemap.xml, jadi setiap segmen didaftarkan eksplisit.
    ...SITEMAP_IDS.map((id) => `Sitemap: ${SITE_URL}/sitemap/${id}.xml`),
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
