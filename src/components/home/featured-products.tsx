import { ProductCard } from "@/components/products/product-card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

// TODO: 実際のデータはAPIから取得
const featuredProducts = [
  {
    id: "1",
    name: "Charizard VSTAR - Pokemon TCG",
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=600&fit=crop",
    price: 89.99,
    comparePrice: 119.99,
    category: "Pokemon",
    rarity: "Ultra Rare",
    condition: "Near Mint",
    stock: 3,
    rating: 4.8,
    isNew: false,
    isFeatured: true
  },
  {
    id: "2",
    name: "Blue-Eyes White Dragon - 1st Edition",
    image: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    price: 299.99,
    comparePrice: 349.99,
    category: "Yu-Gi-Oh!",
    rarity: "Secret Rare",
    condition: "Mint",
    stock: 1,
    rating: 5.0,
    isNew: false,
    isFeatured: true
  },
  {
    id: "3",
    name: "Black Lotus - MTG Vintage",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc4e?w=400&h=600&fit=crop",
    price: 15999.99,
    category: "Magic: The Gathering",
    rarity: "Mythic Rare",
    condition: "Lightly Played",
    stock: 1,
    rating: 5.0,
    isNew: false,
    isFeatured: true
  },
  {
    id: "4",
    name: "Monkey D. Luffy - Leader Card",
    image: "https://images.unsplash.com/photo-1609813040801-8b09a342bd73?w=400&h=600&fit=crop",
    price: 45.99,
    category: "One Piece",
    rarity: "Leader",
    condition: "Near Mint",
    stock: 12,
    rating: 4.5,
    isNew: true,
    isFeatured: true
  }
]

export function FeaturedProducts() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-muted-foreground">Hand-picked cards for collectors</p>
          </div>
          <Link
            href="/products?filter=featured"
            className="hidden md:flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 商品グリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        {/* モバイル用のView Allリンク */}
        <div className="text-center mt-8 md:hidden">
          <Link
            href="/products?filter=featured"
            className="inline-flex items-center gap-2 text-primary font-semibold"
          >
            View All Featured
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}