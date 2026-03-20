"use client"

import { useState, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TestimonialCard, type Testimonial } from "./testimonial-card"

function SkeletonCard() {
  return (
    <div className="px-2">
      <div className="mx-auto w-full max-w-[280px] rounded-[2rem] border-[3px] border-gray-200 bg-gray-200 p-1.5 animate-pulse">
        <div className="rounded-[1.5rem] bg-gray-100">
          <div className="px-4 pb-2 pt-7">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gray-300" />
              <div className="h-4 w-24 rounded bg-gray-300" />
            </div>
          </div>
          <div className="min-h-[200px] px-3 py-3">
            <div className="space-y-2">
              <div className="h-3 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
          <div className="px-4 py-2.5">
            <div className="flex justify-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-4 w-4 rounded bg-gray-300" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
      breakpoints: {
        "(min-width: 768px)": { slidesToScroll: 2 },
        "(min-width: 1024px)": { slidesToScroll: 3 },
      },
    },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })]
  )

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const res = await fetch("/api/testimonials")
        if (res.ok) {
          const data = await res.json()
          setTestimonials(data)
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [])

  // データ0件なら非表示
  if (!loading && testimonials.length === 0) return null

  return (
    <section className="py-10 bg-gradient-to-b from-blue-50/50 to-white">
      <div className="container mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <MessageCircle className="h-5 w-5 text-pink-500" />
            <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
            <MessageCircle className="h-5 w-5 text-pink-500" />
          </div>
          <p className="text-sm text-gray-500">
            Real messages from our happy customers
          </p>
        </div>

        {loading ? (
          /* スケルトンUI */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          /* カルーセル */
          <div className="relative max-w-5xl mx-auto">
            {/* 左矢印 */}
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-4 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border-gray-200 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white disabled:opacity-0 transition-opacity hidden md:flex"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* カルーセル本体 */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {testimonials.map((t) => (
                  <div
                    key={t.id}
                    className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 py-2"
                  >
                    <TestimonialCard testimonial={t} />
                  </div>
                ))}
              </div>
            </div>

            {/* 右矢印 */}
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-4 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border-gray-200 bg-white/90 shadow-md backdrop-blur-sm hover:bg-white disabled:opacity-0 transition-opacity hidden md:flex"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* ドットインジケーター */}
            {scrollSnaps.length > 1 && (
              <div className="mt-5 flex items-center justify-center gap-1.5">
                {scrollSnaps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === selectedIndex
                        ? "w-6 bg-blue-500"
                        : "w-2 bg-gray-300 hover:bg-gray-400"
                    }`}
                    onClick={() => emblaApi?.scrollTo(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
