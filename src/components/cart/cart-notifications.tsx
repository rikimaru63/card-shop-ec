"use client"

import { useEffect, useState, useCallback } from "react"
import { onCartNotification } from "@/store/cart-store"
import { FreeShippingToast } from "@/components/ui/free-shipping-toast"

interface ShippingToastState {
  show: boolean
  currentTotal: number
  threshold: number
  isAchieved: boolean
}

export function CartNotifications() {
  const [shippingToast, setShippingToast] = useState<ShippingToastState>({
    show: false,
    currentTotal: 0,
    threshold: 0,
    isAchieved: false,
  })

  const handleClose = useCallback(() => {
    setShippingToast(prev => ({ ...prev, show: false }))
  }, [])

  useEffect(() => {
    const unsubscribe = onCartNotification((event) => {
      if (event.type === 'item-added') {
        if (event.wasFreeShipping) return

        setShippingToast({
          show: true,
          currentTotal: event.singleBoxTotal,
          threshold: event.freeThreshold,
          isAchieved: event.isFreeShipping,
        })
      }
    })

    return unsubscribe
  }, [])

  return (
    <>
      {shippingToast.show && (
        <FreeShippingToast
          currentTotal={shippingToast.currentTotal}
          threshold={shippingToast.threshold}
          isAchieved={shippingToast.isAchieved}
          onClose={handleClose}
        />
      )}
    </>
  )
}
