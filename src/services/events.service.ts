import { cache } from 'react'
import type { RecruitmentEvent } from '@/types'
import { mockEvents } from '@/mocks/events'
import { computeEventStatus } from '@/lib/events'
import { fetchVjfEvents } from './vjf.service'
import { fetchOfflineEvents, withOfflineDetail } from './rekrutmen.service'

// Status pada data lokal ditulis tangan, jadi pasti basi begitu tanggalnya
// lewat. Selalu hitung ulang dari tanggal supaya badge "Pendaftaran Dibuka"
// dan pemisahan Mendatang/Riwayat ikut waktu sekarang.
function withLiveStatus(e: RecruitmentEvent): RecruitmentEvent {
  return { ...e, status: computeEventStatus(e.date, e.endDate) }
}

// VJF batches come from the live TopLoker API; offline-recruitment events from
// the rekrutmen.stekom.ac.id jadwal API.
export async function fetchEvents(): Promise<RecruitmentEvent[]> {
  const [vjf, offline] = await Promise.all([fetchVjfEvents(), fetchOfflineEvents()])
  // Fall back to mock VJF only if the API returned nothing.
  const vjfEvents = vjf.length > 0 ? vjf : mockEvents.map(withLiveStatus)
  return [...vjfEvents, ...offline]
}

// Detail event offline (pengumuman, galeri, jam) hanya diambil di halaman
// detail — mengambilnya untuk tiap kartu di daftar berarti puluhan request.
export const fetchEventBySlug = cache(async (slug: string): Promise<RecruitmentEvent | null> => {
  const all = await fetchEvents()
  const event = all.find((e) => e.slug === slug)
  if (!event) return null
  return event.type === 'offline' ? withOfflineDetail(event) : event
})
