"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface FreeShippingToastProps {
  currentTotal: number
  threshold: number
  isAchieved: boolean
  onClose: () => void
}

export function FreeShippingToast({
  currentTotal,
  threshold,
  isAchieved,
  onClose,
}: FreeShippingToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const remaining = Math.max(0, threshold - currentTotal)
  const progress = Math.min(100, (currentTotal / threshold) * 100)

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 50)
    const dismissTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300)
    }, 5000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed top-4 right-4 z-[200] w-80 transition-all duration-300 ease-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-xl shadow-lg overflow-hidden ${
          isAchieved ? "border-2 border-emerald-500" : "border border-gray-200"
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{isAchieved ? "🎉" : "🚚"}</span>
              <span className="font-semibold text-sm text-gray-900">
                {isAchieved ? "Free Shipping Unlocked!" : "Free Shipping Progress"}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isAchieved ? (
            <p className="text-sm text-gray-600">
              Your order qualifies for free shipping
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Add{" "}
                <strong className="text-emerald-600 text-base">
                  ¥{remaining.toLocaleString()}
                </strong>{" "}
                more for FREE shipping!
              </p>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">
                  ¥{currentTotal.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  ¥{threshold.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
