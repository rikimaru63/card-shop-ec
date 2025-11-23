"use client"

import { useState, useEffect } from "react"
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
  TrendingUp,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/products/product-card"
import { useCartStore } from "@/store/cart-store"
import { cn } from "@/lib/utils"

// Type definition for Product
interface Product {
  id: string
  sku: string
  name: string
  nameJa?: string
  images: string[]
  price: number
  comparePrice?: number
  category: string
  cardSet?: string
  cardNumber?: string
  rarity?: string
  condition?: string
  language?: string
  foil?: boolean
  firstEdition?: boolean
  stock: number
  rating?: number
  reviewCount?: number
  sold?: number
  description?: string
  features?: string[]
  specifications?: Record<string, string>
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showAddedToCart, setShowAddedToCart] = useState(false)

  const addToCart = useCartStore((state) => state.addItem)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true)
        const response = await fetch(`/api/products/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) throw new Error("Product not found")
          throw new Error("Failed to fetch product")
        }
        const data = await response.json()

        // Transform API data to match component state if needed
        // For now assuming API returns matching structure or we adapt here
        // The API returns 'images' as string[], which matches.
        // It might miss 'features' and 'specifications' if they aren't in DB.
        // We can add defaults.

        setProduct({
          ...data,
          rating: 4.8, // Mock rating
          reviewCount: 12, // Mock reviews
          sold: 5, // Mock sold
          features: [ // Default features if missing
            "Authentic Pokemon TCG Card",
            "Verified Condition",
            "Secure Packaging"
          ],
          specifications: { // Default specs
            "Set": data.cardSet || "Unknown",
            "Rarity": data.rarity || "Unknown",
            "Condition": data.condition || "Unknown"
          }
        })
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const handleAddToCart = () => {
    if (!product) return

    addToCart({
      id: product.id,
      name: product.name,
      image: product.images[0] || '/placeholder.jpg',
      price: product.price,
      category: product.category,
      rarity: product.rarity,
      condition: product.condition,
      stock: product.stock
    })
    setShowAddedToCart(true)
    setTimeout(() => setShowAddedToCart(false), 3000)
  }

  const handleQuantityChange = (delta: number) => {
    if (!product) return
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p>{error || "Product not found"}</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    )
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
                src={product.images[selectedImage] || '/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-contain"
                priority
              />
              {product.stock <= 5 && product.stock > 0 && (
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
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-20 h-28 rounded-lg border-2 overflow-hidden transition-all flex-shrink-0",
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
            )}
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
                        i < Math.floor(product.rating || 0)
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
                {product.rarity && <Badge variant="secondary">{product.rarity}</Badge>}
                {product.condition && <Badge variant="secondary">{product.condition}</Badge>}
                {product.foil && <Badge variant="secondary">Foil</Badge>}
                {product.firstEdition && <Badge variant="secondary">1st Edition</Badge>}
                {product.language && <Badge variant="secondary">{product.language}</Badge>}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-4 pb-6 border-b">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">¥{product.price.toLocaleString()}</span>
                {product.comparePrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ¥{product.comparePrice.toLocaleString()}
                    </span>
                    <Badge variant="destructive">Save ¥{(product.comparePrice - product.price).toLocaleString()}</Badge>
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
                {product.features && (
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
                )}
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
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
                      Free shipping on orders over ¥10,000. Delivery within 3-5 business days.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Express Shipping</h3>
                    <p className="text-sm text-muted-foreground">
                      ¥1,500 flat rate. Delivery within 1-2 business days.
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
      </div>
    </div>
  )
}