import Link from "next/link"
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CheckoutSuccessPage() {
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg border p-8 mb-6">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-2">Order Number</p>
              <p className="text-2xl font-mono font-bold">{orderNumber}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold">Preparing Order</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We're getting your items ready
                </p>
              </div>
              <div>
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold">Email Confirmation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check your inbox for details
                </p>
              </div>
              <div>
                <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold">Track Order</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Updates will be sent via email
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold mb-3">What happens next?</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>You'll receive an order confirmation email shortly with all the details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>We'll send you shipping updates once your order is on its way</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span>Expected delivery: 3-5 business days for standard shipping</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products" className="flex-1">
              <Button className="w-full" size="lg">
                Continue Shopping
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href={`/orders/${orderNumber}`} className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                View Order Details
              </Button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              Need help? Contact us at{" "}
              <a href="mailto:support@cardshop.com" className="text-primary underline">
                support@cardshop.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}