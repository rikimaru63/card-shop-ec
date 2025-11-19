"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Star,
  Heart,
  ShoppingCart,
  Share2,
  Shield,
  Truck,
  Package,
  Minus,
  Plus,
  Check,
  AlertCircle,
  TrendingUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/products/product-card"
import { cn } from "@/lib/utils"

// Mock data - 実際はAPIから取得
const product = {
  id: "1",
  sku: "PKM-CZ-001",
  name: "Charizard VMAX - Darkness Ablaze",
  nameJa: "リザードンVMAX",
  images: [
    "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1609813040801-8b09a342bd73?w=800&h=1200&fit=crop",
    "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800&h=1200&fit=crop"
  ],
  price: 189.99,
  comparePrice: 219.99,
  category: "Pokemon",
  cardSet: "Darkness Ablaze",
  cardNumber: "020/189",
  rarity: "Ultra Rare",
  condition: "Near Mint",
  language: "English",
  foil: true,
  firstEdition: false,
  stock: 5,
  rating: 4.8,
  reviewCount: 124,
  sold: 89,
  description: "Charizard VMAX from the Darkness Ablaze set is one of the most sought-after Pokemon cards. This Ultra Rare card features stunning artwork and powerful attacks that make it a must-have for both collectors and competitive players.",
  features: [
    "Authentic Pokemon TCG Card",
    "Ultra Rare VMAX Pokemon",
    "Perfect for competitive play",
    "Darkness Ablaze Set (2020)",
    "Card Number: 020/189",
    "HP: 330",
    "Attack: G-Max Wildfire (300 damage)",
    "Near Mint condition verified"
  ],
  specifications: {
    "Card Type": "Pokemon - VMAX",
    "HP": "330",
    "Stage": "VMAX",
    "Attack 1": "[Fire][Fire][Fire][Colorless][Colorless] G-Max Wildfire 300",
    "Weakness": "Water ×2",
    "Retreat Cost": "3",
    "Set": "Darkness Ablaze",
    "Number": "020/189",
    "Rarity": "Ultra Rare",
    "Illustrator": "5ban Graphics"
  }
}

const relatedProducts = [
  {
    id: "2",
    name: "Pikachu VMAX - Vivid Voltage",
    image: "https://images.unsplash.com/photo-1609813040801-8b09a342bd73?w=400&h=600&fit=crop",
    price: 79.99,
    comparePrice: 99.99,
    category: "Pokemon",
    rarity: "Secret Rare",
    condition: "Near Mint",
    stock: 8,
    rating: 4.9,
    isNew: true,
    isFeatured: false
  },
  {
    id: "3",
    name: "Umbreon VMAX - Evolving Skies",
    image: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=400&h=600&fit=crop",
    price: 299.99,
    category: "Pokemon",
    rarity: "Secret Rare",
    condition: "Mint",
    stock: 2,
    rating: 5.0,
    isNew: false,
    isFeatured: true
  },
  {
    id: "4",
    name: "Rayquaza VMAX - Evolving Skies",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc4e?w=400&h=600&fit=crop",
    price: 159.99,
    comparePrice: 189.99,
    category: "Pokemon",
    rarity: "Ultra Rare",
    condition: "Near Mint",
    stock: 4,
    rating: 4.7,
    isNew: false,
    isFeatured: false
  },
  {
    id: "5",
    name: "Mew VMAX - Fusion Strike",
    image: "https://images.unsplash.com/photo-1626121602187-1313288432fe?w=400&h=600&fit=crop",
    price: 89.99,
    category: "Pokemon",
    rarity: "Ultra Rare",
    condition: "Near Mint",
    stock: 6,
    rating: 4.6,
    isNew: true,
    isFeatured: false
  }
]

export default function ProductDetailPage({ params: _params }: { params: { id: string } }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showAddedToCart, setShowAddedToCart] = useState(false)

  const handleAddToCart = () => {
    // TODO: カート追加ロジック実装
    setShowAddedToCart(true)
    setTimeout(() => setShowAddedToCart(false), 3000)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  const discount = product.comparePrice 
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-primary">Products</Link>
            <span>/</span>
            <Link href={`/products?category=${product.category}`} className="hover:text-primary">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white rounded-lg border overflow-hidden aspect-[3/4]">
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
              {product.stock <= 5 && (
                <Badge className="absolute top-4 left-4 bg-orange-500">
                  Only {product.stock} left
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-red-500">
                  -{discount}%
                </Badge>
              )}
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative w-20 h-28 rounded-lg border-2 overflow-hidden transition-all",
                    selectedImage === index 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">SKU: {product.sku}</p>
                  <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                  {product.nameJa && (
                    <p className="text-lg text-muted-foreground mb-3">{product.nameJa}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="hover:text-red-500"
                >
                  <Heart className={cn("h-5 w-5", isWishlisted && "fill-red-500 text-red-500")} />
                </Button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                  <span className="text-sm ml-1">{product.rating}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
                <span className="text-sm text-muted-foreground">
                  {product.sold} sold
                </span>
              </div>

              {/* Attributes */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{product.category}</Badge>
                <Badge variant="secondary">{product.rarity}</Badge>
                <Badge variant="secondary">{product.condition}</Badge>
                {product.foil && <Badge variant="secondary">Foil</Badge>}
                {product.firstEdition && <Badge variant="secondary">1st Edition</Badge>}
                <Badge variant="secondary">{product.language}</Badge>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-4 pb-6 border-b">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">${product.price}</span>
                {product.comparePrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.comparePrice}
                    </span>
                    <Badge variant="destructive">Save ${(product.comparePrice - product.price).toFixed(2)}</Badge>
                  </>
                )}
              </div>
              
              {/* Stock Status */}
              <div className="flex items-center gap-2">
                {product.stock > 0 ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600">In Stock ({product.stock} available)</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-red-500 rounded-full" />
                    <span className="text-sm text-red-600">Out of Stock</span>
                  </>
                )}
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  className="flex-1"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>

                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Added to cart notification */}
              {showAddedToCart && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-semibold">Added to cart successfully!</span>
                </div>
              )}

              {/* Quick Buy */}
              <Button 
                variant="outline" 
                className="w-full"
                size="lg"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Buy Now
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="flex flex-col items-center text-center">
                <Shield className="h-8 w-8 text-primary mb-2" />
                <span className="text-xs font-semibold">100% Authentic</span>
                <span className="text-xs text-muted-foreground">Verified Cards</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Truck className="h-8 w-8 text-primary mb-2" />
                <span className="text-xs font-semibold">Fast Shipping</span>
                <span className="text-xs text-muted-foreground">1-3 Business Days</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Package className="h-8 w-8 text-primary mb-2" />
                <span className="text-xs font-semibold">Secure Package</span>
                <span className="text-xs text-muted-foreground">Protected Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-lg border p-6 mb-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.reviewCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">{product.description}</p>
                <div>
                  <h3 className="font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b">
                    <span className="font-semibold">{key}:</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="shipping" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Standard Shipping</h3>
                    <p className="text-sm text-muted-foreground">
                      Free shipping on orders over $100. Delivery within 3-5 business days.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Express Shipping</h3>
                    <p className="text-sm text-muted-foreground">
                      $15 flat rate. Delivery within 1-2 business days.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">International Shipping</h3>
                    <p className="text-sm text-muted-foreground">
                      Available to select countries. Rates calculated at checkout.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                Reviews section coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div>
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} {...relatedProduct} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}