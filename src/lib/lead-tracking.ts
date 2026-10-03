// Pencatatan lead ke dashboard PMB (pmb.stekom.ac.id/api/tracking/submit-direct).
//
// Port dari WhatsAppLeadModal/BrochureRequestForm di astro-kew supaya semua
// situs STEKOM mengirim bentuk payload yang sama (page/button/traffic/
// attribution/user). Dikirim langsung dari browser: endpoint mengizinkan CORS
// dari mana pun, dan konteks halaman (URL, referrer, user agent) memang hanya
// ada di sisi klien.
//
// Tidak pernah memblokir atau menggagalkan form: semua error ditelan.

import { PMB_TRACKING_URL, TRACKING_SOURCE_PAGE } from '@/config/api'

const FIRST = 'first_touch_'
const LAST = 'last_touch_'
const ORGANIC = 'organic'
const TOUCH_KEYS = ['source', 'medium', 'campaign', 'content', 'term', 'campaign_id', 'fbclid'] as const

type Touch = Record<(typeof TOUCH_KEYS)[number], string | null>

function readStore(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function writeStore(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch { /* storage diblokir: atribusi hanya untuk pageview ini */ }
}

// URLSearchParams sudah men-decode %XX dan "+" jadi spasi; tinggal di-trim.
function param(params: URLSearchParams, name: string): string | null {
  const v = params.get(name)?.trim()
  return v ? v : null
}

// Referrer hanya cadangan: tidak pernah menimpa UTM yang valid.
function classifyReferrer(): { source: string; medium: string } | null {
  if (!document.referrer) return null
  let host: string
  try {
    const url = new URL(document.referrer)
    if (url.hostname === window.location.hostname) return null // navigasi internal
    host = url.hostname.toLowerCase()
  } catch {
    return null
  }
  const bare = host.replace(/^www\./, '')
  const name = bare.split('.')[0]
  const pretty = name.charAt(0).toUpperCase() + name.slice(1)
  if (['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'ecosia.'].some((s) => host.includes(s))) {
    return { source: pretty, medium: ORGANIC }
  }
  if (['instagram.', 'facebook.', 'fb.', 'tiktok.', 'twitter.', 'x.com', 'linkedin.', 'youtube.'].some((s) => host.includes(s))) {
    return { source: pretty, medium: 'social' }
  }
  return { source: bare, medium: 'referral' }
}

// Traffic untuk pageview SAAT INI: UTM dulu, lalu referrer, terakhir organic.
function currentTraffic(): Touch {
  const p = new URLSearchParams(window.location.search)
  const fbclid = param(p, 'fbclid')
  const hasUtm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id']
    .some((k) => param(p, k) !== null)
  if (hasUtm) {
    return {
      source: param(p, 'utm_source') ?? ORGANIC,
      medium: param(p, 'utm_medium') ?? ORGANIC,
      campaign: param(p, 'utm_campaign') ?? ORGANIC,
      content: param(p, 'utm_content') ?? ORGANIC,
      term: param(p, 'utm_term'),
      campaign_id: param(p, 'utm_id'),
      fbclid,
    }
  }
  const ref = classifyReferrer()
  return {
    source: ref?.source ?? ORGANIC,
    medium: ref?.medium ?? ORGANIC,
    campaign: ORGANIC,
    content: ORGANIC,
    term: null,
    campaign_id: null,
    fbclid,
  }
}

function persistTouch(prefix: string, t: Touch) {
  for (const k of TOUCH_KEYS) writeStore(prefix + k, t[k])
  writeStore(prefix + 'referrer', document.referrer || null)
}

function loadTouch(prefix: string): Touch | null {
  let any = false
  const t = {} as Touch
  for (const k of TOUCH_KEYS) {
    t[k] = readStore(prefix + k)
    if (t[k] !== null) any = true
  }
  return any ? t : null
}

function touchPayload(prefix: string, fallback: Touch) {
  const t = loadTouch(prefix) ?? fallback
  return {
    source: t.source || ORGANIC,
    medium: t.medium || ORGANIC,
    campaign: t.campaign || ORGANIC,
    content: t.content || ORGANIC,
    term: t.term || null,
    campaign_id: t.campaign_id || null,
    fbclid: t.fbclid || null,
  }
}

/**
 * Catat first/last-touch untuk pageview ini. Dipanggil sekali per muat halaman
 * (LeadTrackingInit di layout) supaya pengunjung dari iklan yang baru mendaftar
 * beberapa hari kemudian tetap tercatat dari iklan itu.
 */
export function recordTouches(): Touch {
  const traffic = currentTraffic()
  // First-touch hanya ditulis sekali, tidak pernah ditimpa.
  if (loadTouch(FIRST) === null) persistTouch(FIRST, traffic)
  // Last-touch hanya maju kalau sumbernya jelas, jadi klik internal tidak
  // menghapus iklan yang membawa pengunjung masuk.
  const known = traffic.source !== ORGANIC || traffic.medium !== ORGANIC
  if (known || loadTouch(LAST) === null) persistTouch(LAST, traffic)
  return traffic
}

function detectUser() {
  const ua = navigator.userAgent || ''
  let os = 'lainnya'
  if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS'
  else if (/Linux|X11/i.test(ua)) os = 'Linux'

  let browser = 'lainnya'
  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/i.test(ua)) browser = 'lainnya'
  else if (/Chrome\/|CriOS/i.test(ua)) browser = 'Chrome'
  else if (/Firefox\/|FxiOS/i.test(ua)) browser = 'Firefox'
  else if (/Safari\//i.test(ua)) browser = 'Safari'

  let device = 'desktop'
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) device = 'tablet'
  else if (/Mobi|Android|iPhone|iPod|Windows Phone/i.test(ua)) device = 'mobile'

  return { device, browser, os }
}

/** "0812-3456 7890" / "+62812..." → "62812..." */
export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export interface LeadInput {
  nama: string
  email: string
  phone: string
  /** Nama form, juga dipakai sebagai `source` di dashboard. */
  form: string
  button: { id: string; label: string; section: string }
  /** Field tambahan khusus form CDC (posisi, event, pendidikan, dst.). */
  extra?: Record<string, string | null | undefined>
}

export function trackLead({ nama, email, phone, form, button, extra }: LeadInput): void {
  try {
    const traffic = recordTouches()
    const params = new URLSearchParams(window.location.search)
    const now = new Date().toISOString()
    const url = window.location.href
    const payload = {
      source_page: TRACKING_SOURCE_PAGE,
      nama,
      email,
      phone: normalizePhone(phone),
      data: {
        page: {
          url,
          path: window.location.pathname.replace(/\/+$/, '') || '/',
          title: document.title,
        },
        button: { ...button, type: 'cta', jurusan: null },
        traffic,
        attribution: {
          referrer: document.referrer || null,
          first_touch: touchPayload(FIRST, traffic),
          last_touch: touchPayload(LAST, traffic),
        },
        user: detectUser(),
        event: { name: 'form_submit', timestamp: now },
        form,
        // Field PMB yang tidak relevan untuk CDC dikirim kosong supaya bentuk
        // payload tetap sama dengan situs lain.
        studyProgram: '',
        studyMethod: '',
        address: '',
        ...extra,
        slug: url.split('?')[0],
        source: form,
        utm_source: params.get('utm_source') ?? '',
        utm_medium: params.get('utm_medium') ?? '',
        utm_campaign: params.get('utm_campaign') ?? '',
        timestamp: now,
      },
    }
    // keepalive: request tetap terkirim walau tab berpindah ke WhatsApp/bit.ly.
    void fetch(PMB_TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* tracking tidak boleh mengganggu pendaftaran */ })
  } catch {
    /* idem */
  }
}
