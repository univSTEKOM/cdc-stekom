// Read a required server-side secret. Called lazily at request time rather than
// at module scope: this module is also pulled into the client bundle (via
// JobListingClient), where server-only vars are undefined by design — throwing
// eagerly would break the browser build instead of the misconfigured server.
function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) {
    throw new Error(
      `${name} is not set. Add it to .env.local (see .env.example) or the deployment environment.`,
    )
  }
  return v
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cdc.stekom.ac.id'
export const GOOGLE_SHEET_WEBHOOK = process.env.GOOGLE_SHEET_WEBHOOK_URL ?? ''

export const REVALIDATE_JOBS = 3600
export const REVALIDATE_CATEGORIES = 86400
export const REVALIDATE_EVENTS = 3600

export const PER_PAGE = 12
export const RELATED_JOBS_COUNT = 5

// ─── CDC Stekom REST API (v1) ──────────────────────────────────────────────────
// Replaces the old POST /curl_loker/* endpoints. Server-side pagination and
// filtering over the full ~570k listing corpus, authenticated with X-API-Key.
//
// The key is a server-side secret: it must never be exposed with NEXT_PUBLIC_.
// Every caller lives in a server component / service, so the bare env var is
// correct here. There is deliberately no fallback — a missing key must fail
// loudly at startup rather than silently shipping a dev credential.
export const CDC_API_BASE = process.env.CDC_API_BASE ?? 'https://cdc.stekom.ac.id/api'
export const getCdcApiKey = () => requireEnv('CDC_API_KEY')

// Upper bound the API enforces on per_page for the loker list.
export const CDC_MAX_PER_PAGE = 100
// Upper bound for the sitemap feed (much higher — it returns only 4 fields).
export const CDC_SITEMAP_MAX_PER_PAGE = 5000

// ─── Virtual Job Fair API (TopLoker) ─────────────────────────────────────────
// Returns all VJF batches. Note: different host + different key than the loker API.
export const VJF_API_URL = process.env.VJF_API_URL ?? 'https://toploker.com/curl/virtual_jobfair'
export const getVjfKey = () => requireEnv('VJF_API_KEY')

// ─── Jadwal Rekrutmen Offline (rekrutmen.stekom.ac.id) ───────────────────────
// Publik, tanpa key (tapi wajib kirim User-Agent). Hanya memuat ringkasan
// jadwal: judul, tanggal, lokasi.
export const REKRUTMEN_API_URL =
  process.env.REKRUTMEN_API_URL ?? 'https://rekrutmen.stekom.ac.id/api/rekrutmen/jadwal'
// Detail (deskripsi, galeri, kapasitas) tidak punya endpoint JSON — hanya
// halaman HTML di /agenda/:slug, yang di-parse oleh rekrutmen.service.ts.
export const REKRUTMEN_AGENDA_URL =
  process.env.REKRUTMEN_AGENDA_URL ?? 'https://rekrutmen.stekom.ac.id/agenda'

// ─── Lead tracking PMB ───────────────────────────────────────────────────────
// Setiap submit form (lamar loker, VJF, rekrutmen offline) juga dicatat ke
// dashboard lead PMB. Dipanggil dari browser, jadi wajib NEXT_PUBLIC_.
export const PMB_TRACKING_URL =
  process.env.NEXT_PUBLIC_PMB_TRACKING_URL || 'https://pmb.stekom.ac.id/api/tracking/submit-direct'
export const TRACKING_SOURCE_PAGE = 'cdc-web'

// Use the real CDC API unless explicitly forced to mock
export const USE_MOCK = process.env.USE_MOCK === 'true'
