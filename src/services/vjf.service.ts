import { cache } from 'react'
import { VJF_API_URL, getVjfKey, REVALIDATE_EVENTS } from '@/config/api'
import type { RecruitmentEvent } from '@/types'
import { computeEventStatus } from '@/lib/events'
import { decodeEntities, htmlToText } from '@/lib/html'
import { parseVjfDescription } from '@/lib/vjf-description'

// ─── Raw API shape (toploker.com/curl/virtual_jobfair) ───────────────────────────

interface RawVjf {
  id: string
  slug: string
  title: string
  batch: string
  description: string
  tanggal_mulai: string
  tanggal_selesai: string
  lokasi: string
  banner: string
  batas_daftar: string
  // organizer / jumlah_perusahaan intentionally ignored
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanTitle(t: string): string {
  // drop the trailing "#90" batch marker and collapse whitespace
  return decodeEntities(t).replace(/#\d+\s*$/, '').replace(/\s+/g, ' ').trim()
}

// Batch number lives in the title as "#90". Absent on older events → 0.
function batchFromTitle(t: string): number {
  const m = t.match(/#(\d+)\s*$/)
  return m ? Number(m[1]) : 0
}

function mapVjf(raw: RawVjf): RecruitmentEvent {
  // Deskripsi TopLoker = satu blok teks tanpa baris baru; dipecah per bagian
  // (link acara, pembicara, dst.) oleh parseVjfDescription.
  const { fullText, ...detail } = parseVjfDescription(htmlToText(raw.description))
  return {
    id: raw.id,
    slug: raw.slug,
    title: cleanTitle(raw.title),
    type: 'vjf',
    batch: batchFromTitle(raw.title),
    description: fullText,
    date: raw.tanggal_mulai,
    endDate: raw.tanggal_selesai || undefined,
    location: decodeEntities(raw.lokasi || '').trim() || 'Online',
    organizer: 'CDC Universitas STEKOM & TopLoker.com',
    banner: raw.banner || undefined,
    registrationDeadline: raw.batas_daftar || undefined,
    status: computeEventStatus(raw.tanggal_mulai, raw.tanggal_selesai),
    ...detail,
  }
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

export const fetchVjfEvents = cache(async (): Promise<RecruitmentEvent[]> => {
  // Resolved outside the try so a missing key is a hard configuration error
  // rather than being swallowed into the empty-array fallback below.
  const key = getVjfKey()
  try {
    const res = await fetch(VJF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // TopLoker blocks datacenter IPs with a 403 the same way cdc.stekom.ac.id
        // does, so this host needs the browser-like headers too.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://toploker.com/',
      },
      body: new URLSearchParams({ key_api: key }).toString(),
      next: { revalidate: REVALIDATE_EVENTS },
    })
    if (!res.ok) throw new Error(`VJF API → HTTP ${res.status}`)
    const data = (await res.json()) as { dx?: RawVjf[] }
    return (data.dx ?? []).map(mapVjf)
  } catch (err) {
    console.error('[vjf] fetch failed, returning empty:', err)
    return []
  }
})
