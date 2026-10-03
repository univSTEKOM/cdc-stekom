'use client'

import { useState } from 'react'
import { Check, Link as LinkIcon } from 'lucide-react'

interface Props {
  url: string
  title: string
}

const btn =
  'flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-brand-muted transition-colors hover:border-cta hover:text-cta active:scale-[0.98]'

export function EventShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false)
  const text = encodeURIComponent(`${title}\n${url}`)
  const u = encodeURIComponent(url)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-brand-text">Bagikan:</span>
      <a href={`https://wa.me/?text=${text}`} target="_blank" rel="noopener noreferrer" className={btn}>
        WhatsApp
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" className={btn}>
        Facebook
      </a>
      <a href={`https://x.com/intent/post?text=${text}`} target="_blank" rel="noopener noreferrer" className={btn}>
        X
      </a>
      <button type="button" onClick={copy} className={`${btn} cursor-pointer ${copied ? 'border-cta text-cta' : ''}`}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
        {copied ? 'Link disalin' : 'Salin link'}
      </button>
    </div>
  )
}
