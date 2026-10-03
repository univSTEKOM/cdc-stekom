'use client'

import { useEffect } from 'react'
import { recordTouches } from '@/lib/lead-tracking'

// Catat first/last-touch di pageview pertama, sebelum ada klik apa pun, supaya
// atribusi iklan tetap ada walau pengunjung baru mendaftar di halaman lain.
export function LeadTrackingInit() {
  useEffect(() => {
    recordTouches()
  }, [])
  return null
}
