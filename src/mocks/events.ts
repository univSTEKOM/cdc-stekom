import type { RecruitmentEvent } from '@/types'
import { mockJobs } from './jobs'

export const mockEvents: RecruitmentEvent[] = [
  // ── VJF ──────────────────────────────────────────────────────────────────
  {
    id: 'vjf-batch-3',
    slug: 'virtual-job-fair-stekom-batch-3-juli-2026',
    title: 'Virtual Job Fair STEKOM Batch 3',
    type: 'vjf',
    batch: 3,
    status: 'upcoming',
    description:
      'VJF Batch 3 menghadirkan 20+ perusahaan teknologi dan kreatif untuk fresh graduate dan profesional. Sesi one-on-one dengan rekruter via Zoom, open untuk seluruh jurusan.',
    date: '2026-07-10T09:00:00Z',
    endDate: '2026-07-12T17:00:00Z',
    location: 'Online (Zoom + Virtual Booth)',
    organizer: 'CDC Universitas Stekom',
    registrationDeadline: '2026-07-07T23:59:00Z',
    jobs: mockJobs.slice(0, 4),
  },
  {
    id: 'vjf-batch-2',
    slug: 'virtual-job-fair-stekom-batch-2-januari-2026',
    title: 'Virtual Job Fair STEKOM Batch 2',
    type: 'vjf',
    batch: 2,
    status: 'past',
    description:
      'VJF Batch 2 diikuti oleh 15 perusahaan mitra dengan total 80+ lowongan tersedia. Berlangsung selama 3 hari penuh via platform virtual interaktif.',
    date: '2026-01-20T09:00:00Z',
    endDate: '2026-01-22T17:00:00Z',
    location: 'Online (Zoom + Virtual Booth)',
    organizer: 'CDC Universitas Stekom',
    registrationDeadline: '2026-01-17T23:59:00Z',
    jobs: mockJobs.slice(2, 6),
  },
  {
    id: 'vjf-batch-1',
    slug: 'virtual-job-fair-stekom-batch-1-agustus-2025',
    title: 'Virtual Job Fair STEKOM Batch 1',
    type: 'vjf',
    batch: 1,
    status: 'past',
    description:
      'VJF perdana CDC Universitas Stekom dengan 10 perusahaan pilihan. Dihadiri 300+ pencari kerja, menghasilkan 45+ penawaran kerja.',
    date: '2025-08-05T09:00:00Z',
    endDate: '2025-08-07T17:00:00Z',
    location: 'Online (Zoom)',
    organizer: 'CDC Universitas Stekom',
    registrationDeadline: '2025-08-02T23:59:00Z',
    jobs: mockJobs.slice(0, 3),
  },
]

export type OfflineEventExtras = Partial<
  Pick<RecruitmentEvent, 'instagramUrl' | 'positions' | 'registrationLinks'>
>

// ── Rekrutmen Offline ──────────────────────────────────────────────────────
// Jadwal dan isi pengumuman diambil dari rekrutmen.stekom.ac.id — lihat
// services/rekrutmen.service.ts. Yang tidak ada di sana (embed IG) atau perlu
// dikoreksi manual ditaruh di sini, dikunci per nomor batch.
export const offlineEventExtras: Partial<Record<number, OfflineEventExtras>> = {
  23: { instagramUrl: 'https://www.instagram.com/p/DbsE_8RJUCG/' },
}
