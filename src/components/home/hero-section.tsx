"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    id: 1,
    title: "Latest Pokemon TCG Collection",
    subtitle: "Scarlet & Violet Series Now Available",
    description: "Get the newest Pokemon cards with exclusive pre-order bonuses",
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1920&h=600&fit=crop",
    cta: "Shop Pokemon",
    href: "/products/pokemon"
  },
  {
    id: 2,
    title: "Graded Cards Collection",
    subtitle: "PSA 10 & BGS 9.5+ Cards",
    description: "Premium graded cards from trusted authentication services",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=1920&h=600&fit=crop",
    cta: "View Graded Cards",
    href: "/products/graded"
  },
  {
    id: 3,
    title: "One Piece Card Game",
    subtitle: "Romance Dawn & Pillars of Strength",
    description: "Join the adventure with the hottest TCG of 2024",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc4e?w=1920&h=600&fit=crop",
    cta: "Shop One Piece",
    href: "/products/onepiece"
  }
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gradient-to-b from-secondary to-background">
      {/* スライド */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide 
                ? "opacity-100 translate-x-0" 
                : index < currentSlide 
                ? "opacity-0 -translate-x-full" 
                : "opacity-0 translate-x-full"
            }`}
          >
            {/* 背景画像 */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            
            {/* コンテンツ */}
            <div className="relative z-20 h-full container mx-auto px-4 flex items-center">
              <div className="max-w-2xl text-white">
                <p className="text-primary text-sm font-semibold mb-2 uppercase tracking-wider">
                  {slide.subtitle}
                </p>
                <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl mb-8 text-gray-200">
                  {slide.description}
                </p>
                <div className="flex gap-4">
                  <Link href={slide.href}>
                    <Button size="lg" className="font-semibold">
                      {slide.cta}
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button size="lg" variant="outline" className="font-semibold bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
                      Browse All
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* 装飾的な要素 */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl z-0" />
          </div>
        ))}
      </div>

      {/* ナビゲーションボタン */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* インジケーター */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? "w-8 bg-primary" 
                : "w-2 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}