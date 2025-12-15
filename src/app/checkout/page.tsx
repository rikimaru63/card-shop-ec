"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle,
  MessageCircle,
  Shield,
  Truck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { formatPrice } from "@/lib/utils"
import { createOrder } from "./actions"
import { toast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/checkout")
    }
  }, [status, router])

  const handleConfirmOrder = async () => {
    if (!session?.user?.email) return

    setIsSubmitting(true)

    try {
      // Prepare cart items for server action
      const cartItems = items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }))

      const result = await createOrder({
        items: cartItems,
        email: session.user.email,
        shippingAddress: {
          // TODO: Get from user's saved addresses
          name: session.user.name || "",
          street1: "",
          city: "",
          state: "",
          postalCode: "",
          country: "US"
        }
      })

      if (result.success && result.orderNumber) {
        setOrderNumber(result.orderNumber)
        setOrderComplete(true)
        clearCart()
        toast({
          title: "Order Placed Successfully!",
          description: "We will send you an invoice via email shortly.",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to place order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Order error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInstagramInquiry = () => {
    window.open("https://ig.me/m/cardshop_official", "_blank")
  }

  // Loading state
  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return null
  }

  // Order Complete State
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg border shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-6">
                Thank you for your order. We will send you a Wise invoice to your email shortly.
              </p>

              {orderNumber && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-mono font-bold text-lg">{orderNumber}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>You will receive a Wise invoice via email within 24 hours</li>
                  <li>Complete the payment through Wise</li>
                  <li>Once payment is confirmed, we will ship your order</li>
                  <li>You will receive tracking information via email</li>
                </ol>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/account/orders">
                  <Button variant="outline">View Order History</Button>
                </Link>
                <Link href="/products">
                  <Button>Continue Shopping</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white rounded-lg border p-12">
              <Package className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
              <p className="text-muted-foreground mb-8">
                Add items to your cart to proceed with checkout.
              </p>
              <Link href="/products">
                <Button size="lg">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = getTotalPrice()
  const shipping = subtotal > 100 ? 0 : 15
  const total = subtotal + shipping

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Order Summary</h2>
                </div>

                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 py-4">
                      <div className="relative w-16 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Card */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Shipping Address</h2>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Please reply to the invoice email with your shipping address, or we will contact you to confirm.
                  </p>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Payment Method</h2>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Wise Invoice Payment</p>
                      <p className="text-sm text-green-700">Low fees, fast international transfers</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800 mt-3">
                    After placing your order, you will receive an invoice via email. Pay securely through Wise.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-6">Complete Your Order</h2>

                {/* Main CTA */}
                <Button
                  className="w-full mb-4"
                  size="lg"
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm & Request Invoice (Wise)
                    </>
                  )}
                </Button>

                {/* Secondary CTA */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleInstagramInquiry}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Inquiry on Instagram
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>¥10,000以上で送料無料</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Secure packaging guaranteed</span>
                  </div>
                </div>

                {/* User info */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground">
                    Logged in as: <span className="font-medium">{session.user?.email}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
