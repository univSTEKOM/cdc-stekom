'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { VJFRegistrationSchema, type VJFRegistrationData } from '@/lib/validators'
import { submitForm } from '@/services/forms.service'
import { trackLead } from '@/lib/lead-tracking'

// Capture utm_* params from the current URL so they can be sent to the sheet.
function getUtmParams(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const out: Record<string, string> = {}
  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (key.startsWith('utm_')) out[key] = value
  })
  return out
}

interface VJFRegistrationFormProps {
  eventId: string
  eventTitle: string
}

export function VJFRegistrationForm({ eventId, eventTitle }: VJFRegistrationFormProps) {
  const [success, setSuccess] = useState(false)
  const [submittedName, setSubmittedName] = useState('')
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VJFRegistrationData>({
    resolver: zodResolver(VJFRegistrationSchema),
    defaultValues: { eventId },
  })

  async function onSubmit(data: VJFRegistrationData) {
    trackLead({
      nama: data.name,
      email: data.email,
      phone: data.phone,
      form: 'Daftar Virtual Job Fair CDC',
      button: { id: 'vjf-registration-form', label: 'Daftar Sekarang', section: 'sidebar' },
      extra: { event: eventTitle, eventId: data.eventId, interestedKuliahKerja: data.interestedKuliahKerja },
    })
    await submitForm({
      formType: 'vjf',
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        interestedKuliahKerja: data.interestedKuliahKerja,
        eventId: data.eventId,
      },
      utm: getUtmParams(),
    })
    setSubmittedName(data.name)
    setSuccess(true)

    // Arahkan ke WhatsApp admin dengan pesan terisi nama pendaftar.
    const text = `Halo, saya ${data.name}. Mohon bantuan untuk pendaftaran ${eventTitle}.`
    const waUrl = `https://wa.me/6283896508234?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank', 'noopener,noreferrer')
  }

  if (success) {
    const text = `Halo, saya ${submittedName}. Mohon bantuan untuk pendaftaran ${eventTitle}.`
    const waUrl = `https://wa.me/6283896508234?text=${encodeURIComponent(text)}`
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-cta" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-brand-text">Pendaftaran Berhasil!</h3>
        <p className="text-sm text-brand-muted">
          Lanjutkan ke WhatsApp admin untuk konfirmasi pendaftaran <strong>{eventTitle}</strong>.
        </p>
        <Button
          render={<a href={waUrl} target="_blank" rel="noopener noreferrer" />}
          className="mt-2 w-full cursor-pointer bg-cta hover:bg-cta-dark text-white"
        >
          Lanjut ke WhatsApp
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <input type="hidden" {...register('eventId')} />

      <div>
        <Label htmlFor="vjf-name">Nama Lengkap *</Label>
        <Input
          id="vjf-name"
          {...register('name')}
          placeholder="Budi Santoso"
          aria-invalid={!!errors.name}
          className="mt-1"
        />
        {errors.name && <p role="alert" className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="vjf-email">Email *</Label>
        <Input
          id="vjf-email"
          type="email"
          {...register('email')}
          placeholder="budi@email.com"
          aria-invalid={!!errors.email}
          className="mt-1"
        />
        {errors.email && <p role="alert" className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="vjf-phone">Nomor Telepon *</Label>
        <Input
          id="vjf-phone"
          type="tel"
          {...register('phone')}
          placeholder="08123456789"
          aria-invalid={!!errors.phone}
          className="mt-1"
        />
        {errors.phone && <p role="alert" className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
      </div>

      <div>
        <Label htmlFor="vjf-kuliahkerja">Tertarik kuliah sambil kerja? *</Label>
        <Controller
          control={control}
          name="interestedKuliahKerja"
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger
                id="vjf-kuliahkerja"
                className="mt-1 w-full"
                aria-invalid={!!errors.interestedKuliahKerja}
              >
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

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full cursor-pointer bg-cta hover:bg-cta-dark text-white"
      >
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Mendaftar...</>
        ) : (
          'Daftar Sekarang'
        )}
      </Button>
    </form>
  )
}
