'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { OfflineRegistrationForm } from '@/features/forms/OfflineRegistrationForm'

interface Props {
  eventTitle: string
  eventUrl: string
  links: { label: string; url: string }[]
  /** Tombol pertama saja, untuk header mobile. */
  primaryOnly?: boolean
  className?: string
}

// Sama seperti tombol "Lamar Sekarang" loker: pendaftar mengisi data dulu
// supaya tercatat di sheet CDC, baru diteruskan ke link bit.ly panitia.
export function OfflineRegisterButtons({ eventTitle, eventUrl, links, primaryOnly, className }: Props) {
  const [active, setActive] = useState<{ label: string; url: string } | null>(null)
  const shown = primaryOnly ? links.slice(0, 1) : links

  return (
    <>
      <div className={className}>
        {shown.map((link, i) => (
          <button
            key={link.url}
            type="button"
            onClick={() => setActive(link)}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors active:scale-[0.98] ${
              i === 0
                ? 'bg-cta text-white hover:bg-cta-dark'
                : 'border border-cta text-cta hover:bg-cta/5'
            }`}
          >
            {link.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>

      <Dialog open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{active?.label ?? 'Daftar'}</DialogTitle>
            <DialogDescription>{eventTitle}</DialogDescription>
          </DialogHeader>
          {/* key: ganti pilihan offline/online = form baru dari awal. */}
          {active && <OfflineRegistrationForm key={active.url} eventTitle={eventTitle} eventUrl={eventUrl} link={active} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
