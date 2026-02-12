'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function MetaPixelPageView() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [pathname])

  return null
}
