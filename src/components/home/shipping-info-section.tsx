"use client"

import {
  Truck,
  Package,
  CreditCard,
  CheckCircle2,
  Box,
  Tags,
  Gift
} from "lucide-react"

export function ShippingInfoSection() {
  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Purchase Flow */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            How to Order
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Step 1 */}
            <div className="relative bg-white rounded-lg border p-4 md:p-6 text-center shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex justify-center mb-3 mt-2">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">Select Items</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Add your favorite items to cart
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-lg border p-4 md:p-6 text-center shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex justify-center mb-3 mt-2">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">Checkout</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Pay securely via Wise
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-lg border p-4 md:p-6 text-center shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex justify-center mb-3 mt-2">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">Shipping</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Carefully packaged and shipped
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-white rounded-lg border p-4 md:p-6 text-center shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="flex justify-center mb-3 mt-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="font-semibold text-sm md:text-base mb-1">Delivery</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Receive your order at home
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Rules */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">
            Shipping Policy
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Single Cards */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Tags className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg">Single Cards</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Free shipping</span> on orders ¥50,000+
                </p>
                <p className="text-sm text-muted-foreground">
                  Under ¥50,000: <span className="font-semibold text-foreground">¥4,500</span> shipping
                </p>
              </div>
            </div>

            {/* BOX */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Box className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg">Sealed BOX & Packs</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Minimum 5 BOX</span> per order
                </p>
                <p className="text-sm text-muted-foreground">
                  Free shipping on orders ¥50,000+
                </p>
                <p className="text-xs text-orange-600 mt-2">
                  *Any combination of BOX types
                </p>
              </div>
            </div>

            {/* Others */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg">Other Items</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-green-600">Shipping included</span> in price
                </p>
                <p className="text-sm text-muted-foreground">
                  No additional shipping fees
                </p>
              </div>
            </div>
          </div>

          {/* Note */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            * Free shipping applies when Single Cards + BOX total is ¥50,000 or more
          </p>
        </div>
      </div>
    </section>
  )
}
