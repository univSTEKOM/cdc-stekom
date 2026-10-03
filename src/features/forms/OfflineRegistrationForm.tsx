'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { OfflineRecruitmentSchema, type OfflineRecruitmentData } from '@/lib/validators'
import { submitForm } from '@/services/forms.service'
import { useApplicantProfile } from '@/hooks/useApplicantProfile'
import { trackLead } from '@/lib/lead-tracking'

function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const out: Record<string, string> = {}
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (key.startsWith('utm_')) out[key] = value
  })
  return out
}

interface Props {
  eventTitle: string
  eventUrl: string
  /** Link pendaftaran asli (bit.ly) — baru dibuka setelah data tersimpan. */
  link: { label: string; url: string }
}

export function OfflineRegistrationForm({ eventTitle, eventUrl, link }: Props) {
  const [done, setDone] = useState(false)
  const [tracked, setTracked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { profile, saveProfile } = useApplicantProfile()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfflineRecruitmentData>({
    resolver: zodResolver(OfflineRecruitmentSchema),
    // Form baru dipasang saat dialog dibuka, jadi profil tersimpan sudah terbaca.
    defaultValues: {
      name: profile.name ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      interestedKuliahKerja: profile.interestedKuliahKerja as OfflineRecruitmentData['interestedKuliahKerja'],
      attendance: link.label,
      eventId: eventUrl,
    },
  })

  async function onSubmit(data: OfflineRecruitmentData) {
    setError(null)
    // Lead PMB cukup sekali: kalau spreadsheet gagal lalu user klik ulang,
    // onSubmit jalan lagi tapi lead tidak dikirim dobel.
    if (!tracked) {
      setTracked(true)
      trackLead({
        nama: data.name,
        email: data.email,
        phone: data.phone,
        form: 'Daftar Rekrutmen Offline CDC',
        button: {
          id: `offline-register-${/online/i.test(link.label) ? 'online' : 'offline'}`,
          label: link.label,
          section: 'register-dialog',
        },
        extra: { event: eventTitle, eventId: eventUrl, attendance: data.attendance, interestedKuliahKerja: data.interestedKuliahKerja },
      })
    }
    try {
      await submitForm({ formType: 'offline', data, utm: getUtmParams() })
    } catch {
      setError('Data gagal terkirim. Periksa koneksi lalu coba lagi.')
      return
    }
    // Profil digabung, bukan ditimpa: alamat/CV dari form lamaran loker tetap ada.
    saveProfile({ ...profile, name: data.name, email: data.email, phone: data.phone, interestedKuliahKerja: data.interestedKuliahKerja })
    setDone(true)
    // Bisa diblokir popup blocker karena terjadi setelah await — tombol di
    // layar sukses jadi jalur cadangan.
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="h-12 w-12 text-cta" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-brand-text">Data kamu tersimpan</h3>
        <p className="text-sm text-brand-muted">
          Satu langkah lagi: selesaikan pendaftaran di formulir resmi panitia.
        </p>
        <Button
          render={<a href={link.url} target="_blank" rel="noopener noreferrer" />}
          className="mt-2 w-full cursor-pointer bg-cta text-white hover:bg-cta-dark"
        >
          Buka Formulir {link.label.replace(/^daftar\s+/i, '')}
          <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input type="hidden" {...register('attendance')} />
      <input type="hidden" {...register('eventId')} />

      <div>
        <Label htmlFor="off-name">Nama Lengkap *</Label>
        <Input id="off-name" {...register('name')} placeholder="Budi Santoso" aria-invalid={!!errors.name} className="mt-1" />
        {errors.name && <p role="alert" className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="off-email">Email *</Label>
        <Input id="off-email" type="email" {...register('email')} placeholder="budi@email.com" aria-invalid={!!errors.email} className="mt-1" />
        {errors.email && <p role="alert" className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="off-phone">Nomor WhatsApp *</Label>
        <Input id="off-phone" type="tel" {...register('phone')} placeholder="08123456789" aria-invalid={!!errors.phone} className="mt-1" />
        {errors.phone && <p role="alert" className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <div>
        <Label htmlFor="off-kuliahkerja">Tertarik kuliah sambil kerja? *</Label>
        <Controller
          control={control}
          name="interestedKuliahKerja"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id="off-kuliahkerja" className="mt-1 w-full" aria-invalid={!!errors.interestedKuliahKerja}>
                <SelectValue placeholder="Pilih jawaban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ya">Ya, tertarik</SelectItem>
                <SelectItem value="tidak">Tidak</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.interestedKuliahKerja && (
          <p role="alert" className="mt-1 text-xs text-destructive">{errors.interestedKuliahKerja.message}</p>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full cursor-pointer bg-cta text-white hover:bg-cta-dark">
        {isSubmitting
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Menyimpan...</>
          : 'Lanjut ke Pendaftaran'}
      </Button>
    </form>
  )
}
