import { HeroSection } from "@/components/home/hero-section"
import { FeaturedSections } from "@/components/home/featured-sections"
import { ShippingInfoSection } from "@/components/home/shipping-info-section"
import { ProductGrid } from "@/components/home/product-grid"
import { FilterSidebar } from "@/components/home/filter-sidebar"
import AnnouncementBanner from "@/components/AnnouncementBanner"

export default function Home() {
  return (
    <>
      {/* Announcements */}
      <div className="container mx-auto px-4 pt-4">
        <AnnouncementBanner />
      </div>

      <HeroSection />

      {/* Featured Sections (Recommended + New Arrivals) */}
      <FeaturedSections />

      {/* Shipping Info Section */}
      <ShippingInfoSection />

      {/* All Products Section */}
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
