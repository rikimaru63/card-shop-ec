import { HeroSection } from "@/components/home/hero-section"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedProducts } from "@/components/home/featured-products"

export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <FeaturedProducts />
    </>
  )
}