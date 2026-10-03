import { cache } from 'react'
import { REKRUTMEN_API_URL, REKRUTMEN_AGENDA_URL, REVALIDATE_EVENTS } from '@/config/api'
import type { RecruitmentEvent } from '@/types'
import { computeEventStatus } from '@/lib/events'
import { decodeEntities, htmlToText } from '@/lib/html'
import { offlineEventExtras } from '@/mocks/events'

// Tanpa User-Agent, rekrutmen.stekom.ac.id membalas 403 {"error":"Forbidden"}.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
}

// ─── Raw API shape (rekrutmen.stekom.ac.id/api/rekrutmen/jadwal) ─────────────

interface RawJadwal {
  id: string
  title: string
  slug: string
  startDate: string
  endDate: string
  location: string
  // status dari API ('completed', dst.) diabaikan — dihitung ulang dari tanggal.
}

interface RawJadwalResponse {
  success: boolean
  groups?: { label: string; provinsiId: string; events: RawJadwal[] }[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Nomor batch ada di ujung judul: "... Batch #029" atau "... #012".
// Slug tidak bisa dipakai — batch #005 punya slug "...-batch-004-...".
function batchFromTitle(t: string): number {
  const m = t.match(/#(\d+)\s*$/)
  return m ? Number(m[1]) : 0
}

// Badge "Batch N" sudah ditampilkan terpisah, jadi penanda batch di judul dibuang.
function cleanTitle(t: string): string {
  return t
    .replace(/\s*(batch\s*)?#\d+\s*$/i, '')
    .replace(/[\s,]+$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Lokasi dari API hanya nama ruangan ("Ruang Confers") — lengkapi kampusnya
// supaya kartu & schema.org Place tetap bermakna di luar konteks.
function fullLocation(loc: string): string {
  const l = (loc || '').trim()
  if (!l) return 'Universitas STEKOM, Semarang'
  return /stekom/i.test(l) ? l : `${l}, Universitas STEKOM`
}

// endDate di API kadang sama persis dengan startDate (tidak diisi) atau malah
// lebih awal (salah input). Keduanya bikin rentang jam "10.07–10.07" atau
// status jadi 'past' di hari-H, jadi abaikan.
function validEndDate(start: string, end: string): string | undefined {
  if (!end) return undefined
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return Number.isNaN(e) || e <= s ? undefined : end
}

function mapJadwal(raw: RawJadwal): RecruitmentEvent {
  const batch = batchFromTitle(raw.title)
  const title = cleanTitle(raw.title)
  const location = fullLocation(raw.location)
  const endDate = validEndDate(raw.startDate, raw.endDate)
  return {
    id: raw.id,
    slug: raw.slug,
    title,
    type: 'offline',
    batch,
    description:
      `${title} di ${location}. Perusahaan mitra hadir langsung di kampus. ` +
      'Bawa CV terbaikmu dan ikuti seleksi on the spot. Terbuka untuk umum dan gratis.',
    date: raw.startDate,
    endDate,
    location,
    organizer: 'CDC Universitas Stekom',
    status: computeEventStatus(raw.startDate, endDate),
    // Detail kurasi lokal (mis. embed IG) menimpa default di atas.
    ...offlineEventExtras[batch],
  }
}

// ─── Fetch: daftar jadwal ────────────────────────────────────────────────────

export const fetchOfflineEvents = cache(async (): Promise<RecruitmentEvent[]> => {
  try {
    const res = await fetch(REKRUTMEN_API_URL, {
      headers: { ...HEADERS, Accept: 'application/json' },
      next: { revalidate: REVALIDATE_EVENTS },
    })
    if (!res.ok) throw new Error(`Rekrutmen API → HTTP ${res.status}`)
    const data = (await res.json()) as RawJadwalResponse
    if (!data.success) throw new Error('Rekrutmen API → success: false')
    // Event dikelompokkan per provinsi; halaman ini menampilkan semuanya.
    return (data.groups ?? []).flatMap((g) => g.events).map(mapJadwal)
  } catch (err) {
    console.error('[rekrutmen] fetch failed, returning empty:', err)
    return []
  }
})

// ─── Fetch: detail dari halaman agenda ───────────────────────────────────────
// Halaman /agenda/:slug di-render server (Astro) tanpa API JSON di baliknya,
// jadi isinya diambil dari markup. Bila strukturnya berubah, tiap field cukup
// hilang (bukan error) dan halaman detail tetap tampil dengan data jadwal.

type OfflineDetail = Pick<
  RecruitmentEvent,
  | 'announcement' | 'intro' | 'requirements' | 'positions'
  | 'gallery' | 'capacity' | 'category' | 'registrationLinks'
> & { time?: { start: string; end?: string } }

// Teks pengumuman ditulis untuk WhatsApp: emoji, *tebal*, judul kapital semua.
// Untuk bagian terstruktur di halaman, semua itu dibuang.
function plain(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\*/g, '')
    .replace(/\s+([.,!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const isShouting = (s: string) => {
  const letters = s.replace(/[^\p{L}]/gu, '')
  return letters.length > 0 && letters.replace(/[^\p{Lu}]/gu, '').length / letters.length > 0.7
}

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/
const REQUIREMENT = /minimal\s+lulusan|terbuka\s+untuk|^catatan/i

// Pecah pengumuman jadi: paragraf pembuka, syarat peserta, dan daftar posisi.
// Jadwal & link pendaftaran sudah punya tempat sendiri di sidebar.
function parseAnnouncement(text: string) {
  const lines = text.split('\n')

  const positions: string[] = []
  const posIdx = lines.findIndex((l) => /posisi\s+tersedia/i.test(l))
  if (posIdx !== -1) {
    for (const line of lines.slice(posIdx + 1)) {
      const m = line.match(BULLET)
      if (!m) break
      const pos = plain(m[1])
      if (pos) positions.push(pos)
    }
  }

  const requirements = [...new Set(lines.map(plain).filter((l) => REQUIREMENT.test(l)))]
    // "TERBUKA UNTUK UMUM" → "Terbuka untuk umum"
    .map((l) => (isShouting(l) ? l.charAt(0) + l.slice(1).toLowerCase() : l))

  // Baris sebelum bagian syarat/posisi/jadwal, tanpa judul kapital semua.
  // htmlToText menjadikan tiap </p> satu baris, jadi dibaca per baris.
  const intro: string[] = []
  for (const line of lines) {
    if (/posisi\s+tersedia|📅|⏰/i.test(line) || REQUIREMENT.test(plain(line))) break
    const p = plain(line)
    if (p && !isShouting(p)) intro.push(p)
  }

  return {
    intro: intro.join('\n\n') || undefined,
    requirements: requirements.length > 0 ? requirements : undefined,
    positions: positions.length > 0 ? positions : undefined,
  }
}

function sidebarValue(html: string, label: string): string | undefined {
  // <span>…Kapasitas </span> <span …> 100 orang </span>  (Kategori pakai <a>)
  const re = new RegExp(`${label}\\s*</span>\\s*<(?:span|a)[^>]*>([^<]+)</(?:span|a)>`)
  const v = html.match(re)?.[1]
  return v ? decodeEntities(v).trim() || undefined : undefined
}

// Jam acara dari pengumuman: "⏰ 08.30 - 12.00 WIB" atau "⏰ 09.00 WIB – Selesai".
// Lebih bisa dipercaya daripada startDate API, yang jamnya sering asal isi.
function parseTime(text: string): OfflineDetail['time'] {
  const m = text.match(/⏰\s*(\d{1,2})[.:](\d{2})(?:\s*WIB)?\s*(?:[-–]\s*(\d{1,2})[.:](\d{2}))?/)
  if (!m) return undefined
  const hm = (h: string, min: string) => `${h.padStart(2, '0')}:${min}`
  return { start: hm(m[1], m[2]), end: m[3] ? hm(m[3], m[4]) : undefined }
}

// Link pendaftaran: baris berisi URL setelah heading "Link Pendaftaran". Label
// diambil dari teks di baris yang sama, atau baris sebelumnya bila kosong.
function parseRegistrationLinks(text: string): RecruitmentEvent['registrationLinks'] {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => /link\s+pendaftar/i.test(l))
  if (start === -1) return undefined
  const clean = (s: string) =>
    s.replace(/\*/g, '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/[\s:]+$/, '').trim()

  const links: { label: string; url: string }[] = []
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(/https?:\/\/\S+/)
    if (!m) continue
    const url = m[0].replace(/[).,]+$/, '')
    if (links.some((l) => l.url === url)) continue
    let label = clean(lines[i].slice(0, m.index))
    if (!label && i > start) label = clean(lines[i - 1])
    links.push({ label: label || 'Daftar Hadir', url })
  }
  return links.length > 0 ? links : undefined
}

// Blok "Link Pendaftaran" dibuang dari teks yang ditampilkan: link bit.ly-nya
// tidak boleh diklik langsung (pendaftar wajib isi form CDC dulu, lihat
// OfflineRegisterButtons). Blok = heading + baris label/URL sesudahnya,
// sampai baris URL terakhir sebelum teks lain dimulai.
function stripRegistrationSection(text: string): string {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => /link\s+pendaftar/i.test(l))
  if (start === -1) return text
  let end = start
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i]
    if (/https?:\/\//.test(l)) end = i
    else if (l.trim() && !/daftar|offline|online|✅/i.test(l)) break
  }
  return [...lines.slice(0, start), ...lines.slice(end + 1)].join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

async function fetchOfflineDetail(slug: string): Promise<OfflineDetail> {
  try {
    const res = await fetch(`${REKRUTMEN_AGENDA_URL}/${encodeURIComponent(slug)}`, {
      headers: { ...HEADERS, Accept: 'text/html' },
      next: { revalidate: REVALIDATE_EVENTS },
    })
    if (!res.ok) throw new Error(`Rekrutmen agenda → HTTP ${res.status}`)
    const html = await res.text()

    const descHtml = html.match(/class="event-description[^"]*"[^>]*>([\s\S]*?)<\/div>/)?.[1]
    const announcement = descHtml ? htmlToText(descHtml) : undefined
    const gallery = [...html.matchAll(/<a href="([^"]+)"[^>]*id="gallery-img-\d+"/g)].map(
      (m) => decodeEntities(m[1]),
    )

    return {
      announcement: announcement ? stripRegistrationSection(announcement) : undefined,
      ...(announcement ? parseAnnouncement(announcement) : {}),
      gallery: gallery.length > 0 ? gallery : undefined,
      capacity: sidebarValue(html, 'Kapasitas'),
      category: sidebarValue(html, 'Kategori'),
      registrationLinks: announcement ? parseRegistrationLinks(announcement) : undefined,
      time: announcement ? parseTime(announcement) : undefined,
    }
  } catch (err) {
    console.error(`[rekrutmen] detail ${slug} failed:`, err)
    return {}
  }
}

// "YYYY-MM-DD" (WIB) + "HH:mm" → ISO UTC.
function wibDateTime(iso: string, hm: string): string {
  const day = new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  return new Date(`${day}T${hm}:00+07:00`).toISOString()
}

/** Lengkapi event offline hasil daftar jadwal dengan isi halaman agendanya. */
export async function withOfflineDetail(event: RecruitmentEvent): Promise<RecruitmentEvent> {
  const { time, ...detail } = await fetchOfflineDetail(event.slug)
  const date = time ? wibDateTime(event.date, time.start) : event.date
  const endDate = time ? (time.end ? wibDateTime(event.date, time.end) : undefined) : event.endDate
  return {
    ...event,
    ...detail,
    date,
    endDate,
    status: computeEventStatus(date, endDate),
    // Kurasi lokal tetap paling akhir supaya bisa mengoreksi hasil parse.
    ...offlineEventExtras[event.batch],
  }
}
