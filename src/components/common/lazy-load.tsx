"use client"

import { useEffect, useRef, useState, ReactNode } from "react"

interface LazyLoadProps {
  children: ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
}

export function LazyLoad({ 
  children, 
  className = "",
  threshold = 0.1,
  rootMargin = "50px"
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin])

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <div className="min-h-[200px]" />}
    </div>
  )
}