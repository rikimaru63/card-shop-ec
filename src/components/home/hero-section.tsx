"use client"

import Link from "next/link"
import Image from "next/image"
import { Truck, Package, Box } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config/site"
import { businessConfig } from "@/lib/config/business"

export function HeroSection() {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Image with slow zoom */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
      >
        <Image
          src="/hero-bg-2.png"
          alt={siteConfig.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </motion.div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full container mx-auto px-4 flex items-center">
        <div className="max-w-2xl text-white">
          <motion.p
            className="text-primary text-sm font-semibold mb-2 uppercase tracking-wider drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {siteConfig.name}
          </motion.p>

          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            {siteConfig.name}
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl mb-8 text-gray-100"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            From SAR to UR - Discover our extensive collection of premium Pokemon cards
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link href="/products">
              <Button size="lg" className="font-semibold shadow-lg hover:scale-105 transition-transform">
                Shop Now
              </Button>
            </Link>
            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="font-semibold bg-white/10 border-white text-white hover:bg-white hover:text-foreground backdrop-blur-sm shadow-lg hover:scale-105 transition-transform"
              >
                Browse All
              </Button>
            </Link>

            {/* Shipping Info Badges */}
            <motion.div
              className="flex flex-wrap gap-3 ml-0 md:ml-4 mt-4 md:mt-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              {[
                { icon: Truck, color: "text-green-400", text: `Free shipping ${businessConfig.currency.symbol}${businessConfig.shipping.freeThreshold.toLocaleString()}+` },
                { icon: Box, color: "text-orange-400", text: `BOX: Min ${businessConfig.box.minimumQuantity} units` },
                { icon: Package, color: "text-blue-400", text: "Others: Shipping incl." },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.2 + i * 0.15 }}
                >
                  <badge.icon className={`h-4 w-4 ${badge.color}`} />
                  <span className="text-sm font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Animated glow effect */}
      <motion.div
        className="absolute right-10 top-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl z-0 pointer-events-none"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </section>
  )
}
