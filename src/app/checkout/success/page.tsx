"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Home, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/config/site"
import { getOrderByNumber } from "@/app/checkout/actions"

// 決済ページ(payment/[orderNumber])と同じ Server Action を再利用し、
// 注文番号(orderNumber)から実データを取得する。
type OrderData = Awaited<ReturnType<typeof getOrderByNumber>>

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('orderNumber')
  const [order, setOrder] = useState<OrderData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber) {
        setLoading(false)
        return
      }

      try {
        const data = await getOrderByNumber(orderNumber)
        if (data) {
          setOrder(data)

          // Meta Pixel: Purchase
          if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
            window.fbq('track', 'Purchase', {
              content_ids: (data.items || []).map((item) => item.product?.id).filter(Boolean),
              content_type: 'product',
              value: Number(data.total),
              currency: 'JPY',
              num_items: (data.items || []).reduce((sum, item) => sum + item.quantity, 0),
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // 注文を取得できなかった場合: 偽の注文番号を作らず、注文履歴へ誘導する。
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Thank you for your order!</h1>
            <p className="text-muted-foreground mb-8">
              We couldn&apos;t load your order details on this page, but your order has been received.
              You can review it anytime from your order history.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/account/orders">
                <Button size="lg" className="gap-2">
                  <Package className="h-4 w-4" />
                  View My Orders
                </Button>
              </Link>
              <Link href="/">
                <Button size="lg" variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
            {siteConfig.contact.email && (
              <p className="mt-8 text-sm text-muted-foreground">
                Questions? Contact us at{" "}
                <a href={`mailto:${siteConfig.contact.email}`} className="text-primary underline">
                  {siteConfig.contact.email}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const totalAmount = Number(order.total)

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Payment Complete!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your purchase.
          </p>

          {/* Order Info Card */}
          <div className="bg-white rounded-lg border p-6 mb-8 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Number</span>
                <span className="font-mono font-bold">{order.orderNumber}</span>
              </div>
              {totalAmount > 0 && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-primary">¥{totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account/orders">
              <Button size="lg" variant="outline" className="gap-2">
                <Package className="h-4 w-4" />
                View My Orders
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Support */}
          {siteConfig.contact.email && (
            <p className="mt-8 text-sm text-muted-foreground">
              Questions? Contact us at{" "}
              <a href={`mailto:${siteConfig.contact.email}`} className="text-primary underline">
                {siteConfig.contact.email}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
