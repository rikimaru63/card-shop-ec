"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface PikachuPromoModalProps {
  onClose: () => void
}

export function PikachuPromoModal({ onClose }: PikachuPromoModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-[400px] max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isVisible ? "scale-100" : "scale-90"
        }`}
        style={{
          background: "#1a1a2e",
          border: "2px solid #fbbf24",
        }}
      >
        {/* Header */}
        <div className="pt-7 pb-4 px-6 text-center relative">
          <div
            className="text-sm font-semibold tracking-widest uppercase mb-2"
            style={{ color: "#fbbf24" }}
          >
            ★ Special Reward ★
          </div>
          <h2 className="text-white text-xl font-extrabold">
            You Unlocked a Promo!
          </h2>
          <button
            onClick={handleClose}
            className="absolute top-3 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
            style={{ background: "rgba(255,255,255,0.1)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card display */}
        <div className="px-10 pb-4 text-center">
          <div
            className="rounded-xl p-[3px]"
            style={{
              background: "linear-gradient(145deg, #fde68a, #fbbf24, #f59e0b)",
              boxShadow: "0 8px 32px rgba(251,191,36,0.3)",
            }}
          >
            <div
              className="rounded-[10px] py-6 px-4 text-center"
              style={{
                background: "linear-gradient(145deg, #fffbeb, #fef3c7)",
              }}
            >
              <div className="text-5xl mb-2">⚡</div>
              <div className="text-lg font-extrabold" style={{ color: "#92400e" }}>
                PIKACHU
              </div>
              <div
                className="text-xs font-semibold tracking-widest"
                style={{ color: "#a16207" }}
              >
                PROMO CARD
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 text-center">
          <p className="text-sm text-white/70 mb-4">
            Exclusive gift for first-time buyers
            <br />
            spending ¥50,000+
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl text-base font-bold transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              color: "#1a1a2e",
            }}
          >
            Continue Shopping ⚡
          </button>
        </div>
      </div>
    </div>
  )
}
