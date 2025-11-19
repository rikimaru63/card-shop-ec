import { HeroSection } from "@/components/home/hero-section"
import { ProductGrid } from "@/components/home/product-grid"
import { FilterSidebar } from "@/components/home/filter-sidebar"

export default function Home() {
  return (
    <>
      <HeroSection />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <FilterSidebar />
          </aside>
          <main className="flex-1">
            <ProductGrid />
          </main>
        </div>
      </div>
    </>
  )
}
