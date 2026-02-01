"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Order {
  id: string
  orderNumber: string
  total: number
  email: string
  status: string
  paymentStatus: string
  items: Array<{
    quantity: number
    price: number
    product: { name: string }
  }>
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)
  const [_loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/orders/${orderId}`)
        if (response.ok) {
          const data = await response.json()
          setOrder(data)
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  const orderNumber = order?.orderNumber || `ORD-${Date.now().toString().slice(-8)}`
  const totalAmount = order ? Number(order.total) : 0

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
                <span className="font-mono font-bold">{orderNumber}</span>
              </div>
              {totalAmount > 0 && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-primary">¥{totalAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Home Link */}
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          {/* Support */}
          <p className="mt-8 text-sm text-muted-foreground">
            Questions? Contact us at{" "}
            <a href="mailto:support@samuraicardhub.com" className="text-primary underline">
              support@samuraicardhub.com
            </a>
          </p>
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
