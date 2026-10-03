export interface Job {
  id: string
  slug: string
  title: string
  company: string
  companyLogo?: string
  location: string
  locationSlug: string
  category: string
  categorySlug: string
  employmentType: string
  employmentTypeSlug: string
  experienceLevel?: 'fresh-graduate' | 'junior' | 'mid' | 'senior'
  salary?: string
  education?: string
  disabilityFriendly?: boolean
  description: string
  requirements: string[]
  skills: string[]
  applyUrl?: string
  /** Absent when the backend row carries MySQL's zero-date ("0000-00-00"). */
  postedAt?: string
  expiresAt?: string
}

export interface JobsResponse {
  jobs: Job[]
  total: number
  page: number
  perPage: number
  // ── Hanya terisi pada pencarian keyword ──────────────────────────────────
  // Kueri multi-kata dipecah karena API hanya mencocokkan satu istilah literal,
  // jadi hasil bisa berasal dari istilah yang lebih longgar daripada yang
  // diketik user. Tiga field ini dipakai UI untuk memberi tahu hal itu.
  /** Istilah yang benar-benar dipakai untuk mengambil hasil ini. */
  appliedKeyword?: string
  /** Nama wilayah yang terdeteksi dari kueri. */
  appliedLocationName?: string
  /** True kalau syarat diturunkan agar tidak nol hasil. */
  relaxed?: boolean
}

export interface JobsParams {
  page?: number
  perPage?: number
  keyword?: string
  category?: string
  location?: string
  employmentType?: string
  salaryRange?: string
  experienceLevel?: string
}

export interface Category {
  slug: string
  name: string
  count: number
}

export interface Location {
  slug: string
  name: string
  count: number
}

export interface TipeKerja {
  slug: string
  name: string
  count: number
}

export type EventType = 'vjf' | 'offline'

export interface RecruitmentEvent {
  id: string
  slug: string
  title: string
  type: EventType
  batch: number
  description: string
  date: string
  endDate?: string
  location: string
  organizer: string
  banner?: string
  jobs?: Job[]
  registrationDeadline?: string
  status: 'upcoming' | 'ongoing' | 'past'
  // Rekrutmen offline: pengumuman aslinya di Instagram, di-embed pada halaman detail.
  instagramUrl?: string
  // Posisi yang dibuka, disalin dari poster (event offline belum punya API loker).
  positions?: string[]
  // Link pendaftaran eksternal (bit.ly) dari poster.
  registrationLinks?: { label: string; url: string }[]
  // Rekrutmen offline (halaman agenda rekrutmen.stekom.ac.id):
  // teks pengumuman asli bergaya WhatsApp (*tebal*, baris baru dipertahankan).
  announcement?: string
  // Diturunkan dari announcement: paragraf pembuka & syarat peserta.
  intro?: string
  requirements?: string[]
  gallery?: string[]
  // VJF (deskripsi TopLoker yang dipecah per bagian):
  stats?: { value: string; label: string }[]
  benefits?: string[]
  speakers?: { role: string; name: string; title?: string }[]
  eventLinks?: { label: string; url: string; note?: string }[]
  companyContact?: { label: string; url: string }
  hostedBy?: string
  capacity?: string
  category?: string
}

export interface EventsResponse {
  events: RecruitmentEvent[]
  total: number
}

export interface FormSubmitPayload {
  formType: 'job-application' | 'vjf' | 'offline'
  data: Record<string, string>
  // UTM params captured from the landing URL — forwarded to the sheet as-is.
  utm?: Record<string, string>
}

export interface Crumb {
  label: string
  href: string
}
