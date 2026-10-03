import type { RecruitmentEvent } from '@/types'

// Deskripsi VJF dari TopLoker datang sebagai satu blok teks tanpa baris baru
// ("...E-moneyJum'at, 9 Oktober 2026Pukul 10.00 WITA..."), tapi selalu disusun
// dari template yang sama. Teks dipotong di frasa-frasa template itu, lalu tiap
// baris dipilah jadi bagian halaman. Frasa yang tidak dikenali tetap ikut di
// `fullText`, jadi tidak ada informasi yang hilang bila templatenya berubah.

const BREAKS = [
  'VIRTUAL JOBFAIR', 'Pukul', 'Guest Star', 'Opening Speech', 'Bersama', 'Terhubung',
  'Ada sesi', 'Yuk', 'Daftar dan', 'GRATIS:', 'Pendaftaran', 'Dapatkan', 'Zoom Meeting',
  'Live Youtube', 'Booth Virtual', 'Link ', 'Beasiswa', 'Informasi',
  'Diselenggarakan',
]
const BREAK_RE = new RegExp(`\\s*(${BREAKS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')

const URL_RE = /((?:https?:\/\/)?(?:bit\.ly|wa\.me|s\.id|forms\.gle|toploker\.com|docs\.google\.com)(?:\/[^\s()]*)?)/i

// Baris yang tidak boleh tampil di mana pun (bagian terstruktur maupun teks
// lengkap): link daftar peserta, Zoom + ID/sandinya, dan "Informasi Lengkap"
// (halaman TopLoker yang juga berisi link daftar). Peserta wajib lewat form
// CDC di sidebar supaya tercatat; info Zoom didapat dari admin setelah daftar.
const HIDDEN = /^(pendaftaran\s+(peserta\s+)?virtual\s+job\s*fair|pendaftaran\s+peserta|zoom\s+meeting|link\s+zoom\s*:|informasi\s+lengkap)|zoom-toploker|ID Rapat|Meeting ID/i

const absolute =(u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`)

export function splitVjfDescription(text: string): string[] {
  return text
    .replace(BREAK_RE, '\n$1')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

// "Link download Brosur PMB Universitas STEKOM" → "Brosur PMB Universitas STEKOM"
function cleanLinkLabel(label: string): string {
  return label
    .trim()
    .replace(/^link\s+(download\s+)?/i, '')
    .replace(/\s+kunjungi$/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim()
}

type VjfDetail = Pick<
  RecruitmentEvent,
  'intro' | 'stats' | 'benefits' | 'speakers' | 'eventLinks' | 'companyContact' | 'hostedBy'
> & { fullText: string }

export function parseVjfDescription(text: string): VjfDetail {
  const lines = splitVjfDescription(text)
  const intro: string[] = []
  const speakers: NonNullable<RecruitmentEvent['speakers']> = []
  const eventLinks: { label: string; url: string; note?: string }[] = []
  let companyContact: VjfDetail['companyContact']
  let hostedBy: string | undefined

  for (const line of lines) {
    const speaker = line.match(/^(Guest Star|Opening Speech)\s*(.+)$/i)
    if (speaker) {
      // Nama & jabatan menempel tanpa spasi ("Dahlia PolandPemeran dan Model"):
      // pisahkan di batas huruf → Kapital-kecil, atau di tanda "-".
      const [name, ...title] = speaker[2]
        .replace(/([A-Za-z.)])(?=[A-Z][a-z]{2,})/g, '$1\n')
        .split(/\n|\s+-\s*|-(?=[A-Z])/)
        .map((s) => s.trim())
        .filter(Boolean)
      speakers.push({ role: speaker[1], name, title: title.join(', ') || undefined })
      continue
    }
    if (/^(Bersama|Terhubung|Ada sesi|Yuk|Daftar dan)/i.test(line)) {
      intro.push(line)
      continue
    }
    const hosted = line.match(/^Diselenggarakan oleh\s+(.+)$/i)
    if (hosted) {
      hostedBy = hosted[1]
      continue
    }
    if (HIDDEN.test(line)) continue
    const url = line.match(URL_RE)?.[1]
    if (!url) continue
    const [rawLabel] = line.split(':')
    if (/perusahaan|informasi\s*(&\s*pendaftaran|wa)/i.test(rawLabel) || /hubungitoploker/i.test(url)) {
      companyContact ??= { label: 'Hubungi TopLoker', url: absolute(url) }
      continue
    }
    if (/^(live|booth|link|beasiswa)/i.test(rawLabel)) {
      if (!eventLinks.some((l) => l.url === absolute(url))) {
        eventLinks.push({ label: cleanLinkLabel(rawLabel), url: absolute(url) })
      }
    }
  }

  const stats: { value: string; label: string }[] = []
  const companies = text.match(/(\d[\d.]*\+)\s*perusahaan/i)
  if (companies) stats.push({ value: companies[1], label: 'Perusahaan' })
  const schools = text.match(/(\d[\d.]*\+)\s*SMK\/SMA/i)
  if (schools) stats.push({ value: schools[1], label: 'SMK/SMA partner' })
  const prize = text.match(/Doorprize\s+(\d+\s*(?:rb|ribu|juta))/i)
  if (prize) stats.push({ value: prize[1].replace(/juta/i, 'Juta'), label: 'Doorprize e-money' })

  const benefits: string[] = []
  if (/konsultasi\s+cv/i.test(text)) benefits.push('Sesi konsultasi CV bersama rekruter')
  if (/e-?sertifikat/i.test(text)) benefits.push('E-sertifikat terverifikasi Verifikasi.me, terbit H+5')
  if (prize) benefits.push(`Kesempatan dapat doorprize ${stats.at(-1)!.value} e-money`)
  benefits.push('Gratis, cukup ikut lewat Zoom')

  return {
    intro: intro.join(' ') || undefined,
    stats: stats.length > 0 ? stats : undefined,
    benefits,
    speakers: speakers.length > 0 ? speakers : undefined,
    eventLinks: eventLinks.length > 0 ? eventLinks : undefined,
    companyContact,
    hostedBy,
    fullText: lines.filter((l) => !HIDDEN.test(l)).join('\n'),
  }
}
