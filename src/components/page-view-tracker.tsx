"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    // Extract productId from product pages: /products/[slug] → need to fetch id
    // For simplicity, send path only; productId resolved server-side if needed
    const productMatch = pathname.match(/^\/products\/([^/]+)$/)

    const data: { path: string; productId?: string } = { path: pathname }

    // Use sendBeacon for reliability (fires even on page unload)
    const payload = JSON.stringify(data)

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/pageview", new Blob([payload], { type: "application/json" }))
    } else {
      fetch("/api/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {}) // Silent fail
    }
  }, [pathname])

  return null
}
