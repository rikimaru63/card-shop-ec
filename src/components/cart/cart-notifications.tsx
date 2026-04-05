"use client"

import { useEffect, useState, useCallback } from "react"
import { onCartNotification } from "@/store/cart-store"
import { FreeShippingToast } from "@/components/ui/free-shipping-toast"
import { PikachuPromoModal } from "@/components/ui/pikachu-promo-modal"

interface ShippingToastState {
  show: boolean
  currentTotal: number
  threshold: number
  isAchieved: boolean
}

const PIKACHU_PROMO_THRESHOLD = 50000
const PIKACHU_SHOWN_KEY = "pikachu-promo-shown"

export function CartNotifications() {
  const [shippingToast, setShippingToast] = useState<ShippingToastState>({
    show: false,
    currentTotal: 0,
    threshold: 0,
    isAchieved: false,
  })
  const [showPikachuPromo, setShowPikachuPromo] = useState(false)
  const [pikachuChecking, setPikachuChecking] = useState(false)

  const handleShippingClose = useCallback(() => {
    setShippingToast(prev => ({ ...prev, show: false }))
  }, [])

  const handlePikachuClose = useCallback(() => {
    setShowPikachuPromo(false)
    try {
      sessionStorage.setItem(PIKACHU_SHOWN_KEY, "true")
    } catch {
      // sessionStorage unavailable (SSR)
    }
  }, [])

  const checkPikachuEligibility = useCallback(async () => {
    try {
      if (sessionStorage.getItem(PIKACHU_SHOWN_KEY) === "true") return
    } catch {
      // sessionStorage unavailable
    }

    if (pikachuChecking) return
    setPikachuChecking(true)

    try {
      const res = await fetch("/api/user/promo-eligibility")
      if (!res.ok) return
      const data = await res.json()
      if (data.eligible) {
        setShowPikachuPromo(true)
      }
    } catch {
      // Silently fail — promo is a nice-to-have
    } finally {
      setPikachuChecking(false)
    }
  }, [pikachuChecking])

  useEffect(() => {
    const unsubscribe = onCartNotification((event) => {
      if (event.type === 'item-added') {
        // Free shipping toast
        if (!event.wasFreeShipping) {
          setShippingToast({
            show: true,
            currentTotal: event.singleBoxTotal,
            threshold: event.freeThreshold,
            isAchieved: event.isFreeShipping,
          })
        }

        // Pikachu promo check: when total crosses ¥50,000 threshold
        if (
          event.singleBoxTotal >= PIKACHU_PROMO_THRESHOLD &&
          event.previousSingleBoxTotal < PIKACHU_PROMO_THRESHOLD
        ) {
          checkPikachuEligibility()
        }
      }
    })

    return unsubscribe
  }, [checkPikachuEligibility])

  return (
    <>
      {shippingToast.show && (
        <FreeShippingToast
          currentTotal={shippingToast.currentTotal}
          threshold={shippingToast.threshold}
          isAchieved={shippingToast.isAchieved}
          onClose={handleShippingClose}
        />
      )}
      {showPikachuPromo && (
        <PikachuPromoModal onClose={handlePikachuClose} />
      )}
    </>
  )
}
