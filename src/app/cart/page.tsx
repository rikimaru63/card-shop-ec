"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowLeft,
  Truck,
  Shield,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCartStore } from "@/store/cart-store"
import { formatPrice } from "@/lib/utils"

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartStore()
  const [couponCode, setCouponCode] = useState("")
  
  const subtotal = getTotalPrice()
  const shipping = subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.08 // 8% tax
  const total = subtotal + shipping + tax

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg border p-12">
              <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
              <p className="text-muted-foreground mb-8">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Link href="/products">
                <Button size="lg">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* ページヘッダー */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">
            {items.length} {items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* カートアイテム */}
          <div className="lg:col-span-2 space-y-4">
            {/* ヘッダーアクション */}
            <div className="bg-white rounded-lg border p-4 flex justify-between items-center">
              <Link href="/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>

            {/* アイテムリスト */}
            <div className="bg-white rounded-lg border">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="p-6 border-b last:border-b-0"
                >
                  <div className="flex gap-4">
                    {/* 商品画像 */}
                    <Link href={`/products/${item.id}`}>
                      <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    </Link>

                    {/* 商品情報 */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Link href={`/products/${item.id}`}>
                            <h3 className="font-semibold hover:text-primary transition-colors">
                              {item.name}
                            </h3>
                          </Link>
                          <div className="flex gap-2 mt-1">
                            {item.category && (
                              <span className="text-xs text-muted-foreground">
                                {item.category}
                              </span>
                            )}
                            {item.rarity && (
                              <span className="text-xs text-muted-foreground">
                                • {item.rarity}
                              </span>
                            )}
                            {item.condition && (
                              <span className="text-xs text-muted-foreground">
                                • {item.condition}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* 価格と数量 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-4 text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatPrice(item.price)} each
                          </p>
                        </div>
                      </div>

                      {/* 在庫警告 */}
                      {item.stock <= 5 && (
                        <p className="text-xs text-orange-600 mt-2">
                          Only {item.stock} left in stock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 注文サマリー */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              {/* クーポンコード */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button variant="outline">Apply</Button>
                </div>
              </div>

              {/* 価格詳細 */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-3">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {/* チェックアウトボタン */}
              <Link href="/checkout">
                <Button className="w-full mt-6" size="lg">
                  Proceed to Checkout
                </Button>
              </Link>

              {/* セキュリティバッジ */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>Encrypted payment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="h-4 w-4" />
                  <span>Free shipping over $100</span>
                </div>
              </div>

              {/* 配送情報 */}
              <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Estimated delivery: 3-5 business days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* おすすめ商品セクション */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="bg-white rounded-lg border p-6">
            <p className="text-center text-muted-foreground">
              Recommended products coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}