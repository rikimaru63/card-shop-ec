"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const slides = [
  {
    id: 1,
    title: "Pokemon Trading Cards",
    subtitle: "Latest Sets & Rare Cards",
    description: "From SAR to UR - Discover our extensive collection of premium Pokemon cards",
    image: "/hero-bg-1.png",
    cta: "Shop Now",
    href: "/products"
  },
  {
    id: 2,
    title: "PSA & BGS Graded Cards",
    subtitle: "Certified Authentic",
    description: "High-grade certified cards from trusted grading companies",
    image: "/hero-bg-2.png",
    cta: "View Graded Cards",
    href: "/products?graded=true"
  },
  {
    id: 3,
    title: "Pre-Order New Releases",
    subtitle: "Launch Day Delivery",
    description: "Reserve the latest booster packs and secure your cards",
    image: "/hero-bg-3.png",
    cta: "Pre-Order Now",
    href: "/products?preorder=true"
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
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide
                ? "opacity-100 scale-100"
                : "opacity-0 scale-105"
            }`}
          >
            {/* Background Image for each slide */}
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={`${slide.title} Background`}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
              {/* Dark Overlay for text readability */}
              <div className="absolute inset-0 bg-black/50" />
              {/* Gradient overlay from left for text area */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              {/* Bottom gradient for smooth transition */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full container mx-auto px-4 flex items-center">
              <div className="max-w-2xl text-white">
                <p className="text-primary text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg">
                  {slide.subtitle}
                </p>
                <h1
                  className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {slide.title}
                </h1>
                <p
                  className="text-lg md:text-xl mb-8 text-gray-100"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {slide.description}
                </p>
                <div className="flex gap-4">
                  <Link href={slide.href}>
                    <Button size="lg" className="font-semibold shadow-lg">
                      {slide.cta}
                    </Button>
                  </Link>
                  <Link href="/products">
                    <Button
                      size="lg"
                      variant="outline"
                      className="font-semibold bg-white/10 border-white text-white hover:bg-white hover:text-foreground backdrop-blur-sm shadow-lg"
                    >
                      Browse All
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Decorative glow effect */}
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl z-0 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 transition-all duration-300 rounded-full shadow-md ${
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
