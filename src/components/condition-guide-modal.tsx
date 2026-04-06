"use client"

import { useState } from "react"
import { X, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const conditionExamples = {
  gradeA: {
    label: "Grade A",
    description: "Near mint condition. No visible damage, scratches, or whitening.",
    images: [
      { src: "https://images.samuraicardhub.com/condition-examples/n1s2sxmvpnrebsh1vhn6.jpg", alt: "Grade A - Front" },
      { src: "https://images.samuraicardhub.com/condition-examples/ioopnlamaiu00ejgvc2k.jpg", alt: "Grade A - Back" },
    ],
  },
  gradeB: {
    label: "Grade B",
    description: "Lightly played. Minor whitening on edges or light scratches may be present.",
    images: [
      { src: "https://images.samuraicardhub.com/condition-examples/ngvsq4yaj2887mf0brno.jpg", alt: "Grade B - Front" },
      { src: "https://images.samuraicardhub.com/condition-examples/lq0sdydinuxfcwpfym4y.jpg", alt: "Grade B - Front Close-up" },
      { src: "https://images.samuraicardhub.com/condition-examples/plcngccdwpn1rh1zuj6e.jpg", alt: "Grade B - Back" },
      { src: "https://images.samuraicardhub.com/condition-examples/xh0dffizio13qdsoosqz.jpg", alt: "Grade B - Back Close-up" },
    ],
  },
}

export function ConditionGuideLink() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
      >
        <Info className="h-3 w-3" />
        Condition Guide
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed inset-x-4 top-[5%] bottom-[5%] md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[640px] md:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 className="text-lg font-bold">Condition Guide</h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {Object.entries(conditionExamples).map(([key, grade]) => (
                  <div key={key}>
                    <div className="mb-3">
                      <h3 className="text-base font-semibold">{grade.label}</h3>
                      <p className="text-sm text-muted-foreground">{grade.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {grade.images.map((img, i) => (
                        <div key={i} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border">
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                            {img.alt.split(" - ")[1]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
