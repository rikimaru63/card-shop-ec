"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-bg-2.png"
          alt="Pokemon Trading Cards"
          fill
          priority
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
            Premium Pokemon Cards
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            Pokemon Trading Cards
          </h1>
          <p
            className="text-lg md:text-xl mb-8 text-gray-100"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
          >
            From SAR to UR - Discover our extensive collection of premium Pokemon cards
          </p>
          <div className="flex gap-4">
            <Link href="/products">
              <Button size="lg" className="font-semibold shadow-lg">
                Shop Now
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
    </section>
  )
}
