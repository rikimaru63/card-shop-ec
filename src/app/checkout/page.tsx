"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowLeft, 
  Lock, 
  CreditCard, 
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useCartStore } from "@/store/cart-store"
import { formatPrice } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore()
  const [step, setStep] = useState(1) // 1: Shipping, 2: Payment, 3: Review
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  
  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: ""
  })
  
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("wise")
  
  // Calculate totals
  const subtotal = getTotalPrice()
  const shippingCost = shippingMethod === "express" ? 15 : subtotal > 100 ? 0 : 10
  const tax = subtotal * 0.08
  const total = subtotal + shippingCost + tax

  const handlePlaceOrder = () => {
    // TODO: 実際の注文処理
    clearCart()
    // Redirect to success page
    window.location.href = "/checkout/success"
  }

  const steps = [
    { id: 1, name: "Shipping", icon: Truck },
    { id: 2, name: "Payment", icon: CreditCard },
    { id: 3, name: "Review", icon: CheckCircle }
  ]

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
                <Button size="lg">
                  Continue Shopping
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            {steps.map((s, index) => {
              const Icon = s.icon
              return (
                <div key={s.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    step >= s.id ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}>
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-20 h-1 mx-2",
                      step > s.id ? "bg-primary" : "bg-gray-200"
                    )} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            {step === 1 && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-6">Shipping Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={shippingInfo.firstName}
                        onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St"
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="apartment">Apartment, Suite, etc. (Optional)</Label>
                    <Input
                      id="apartment"
                      placeholder="Apt 4B"
                      value={shippingInfo.apartment}
                      onChange={(e) => setShippingInfo({...shippingInfo, apartment: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="New York"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        placeholder="NY"
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="10001"
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Methods */}
                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Shipping Method</h3>
                  <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard" className="cursor-pointer">
                            <div>
                              <p className="font-medium">Standard Shipping</p>
                              <p className="text-sm text-muted-foreground">5-7 business days</p>
                            </div>
                          </Label>
                        </div>
                        <span className="font-semibold">
                          {subtotal > 100 ? "FREE" : formatPrice(10)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="express" id="express" />
                          <Label htmlFor="express" className="cursor-pointer">
                            <div>
                              <p className="font-medium">Express Shipping</p>
                              <p className="text-sm text-muted-foreground">2-3 business days</p>
                            </div>
                          </Label>
                        </div>
                        <span className="font-semibold">{formatPrice(15)}</span>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={() => setStep(2)}
                >
                  Continue to Payment
                </Button>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-6">Payment Method</h2>
                
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-4">
                    {/* Wise Payment */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <RadioGroupItem value="wise" id="wise" />
                        <Label htmlFor="wise" className="cursor-pointer flex items-center gap-2">
                          <span className="font-semibold">Wise (Recommended)</span>
                          <Badge className="bg-green-100 text-green-800">Low Fees</Badge>
                        </Label>
                      </div>
                      {paymentMethod === "wise" && (
                        <div className="ml-6 space-y-3">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <p className="font-medium text-blue-900">International transfers made easy</p>
                                <p className="text-blue-700 mt-1">
                                  Save up to 8x compared to banks. Fast, secure, and transparent fees.
                                </p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            You will be redirected to Wise to complete your payment securely.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Credit Card */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="cursor-pointer">
                          <span className="font-semibold">Credit/Debit Card</span>
                        </Label>
                      </div>
                      {paymentMethod === "card" && (
                        <div className="ml-6 space-y-4">
                          <div>
                            <Label htmlFor="cardNumber">Card Number</Label>
                            <Input
                              id="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">Expiry Date</Label>
                              <Input
                                id="expiry"
                                placeholder="MM/YY"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                placeholder="123"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PayPal */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="paypal" id="paypal" />
                        <Label htmlFor="paypal" className="cursor-pointer">
                          <span className="font-semibold">PayPal</span>
                        </Label>
                      </div>
                      {paymentMethod === "paypal" && (
                        <p className="text-sm text-muted-foreground ml-6 mt-2">
                          You will be redirected to PayPal to complete your payment.
                        </p>
                      )}
                    </div>
                  </div>
                </RadioGroup>

                <div className="flex gap-4 mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back to Shipping
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setStep(3)}
                    className="flex-1"
                  >
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Order Review */}
                <div className="bg-white rounded-lg border p-6">
                  <h2 className="text-xl font-bold mb-6">Review Your Order</h2>
                  
                  {/* Shipping Address */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Shipping Address</h3>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{shippingInfo.firstName} {shippingInfo.lastName}</p>
                      <p>{shippingInfo.address}</p>
                      {shippingInfo.apartment && <p>{shippingInfo.apartment}</p>}
                      <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}</p>
                      <p>{shippingInfo.phone}</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Payment Method</h3>
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                        Edit
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {paymentMethod === "wise" && "Wise Transfer"}
                      {paymentMethod === "card" && "Credit/Debit Card"}
                      {paymentMethod === "paypal" && "PayPal"}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3 py-3 border-b last:border-0">
                          <div className="relative w-16 h-20 rounded overflow-hidden bg-gray-100">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary underline">
                        Terms and Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep(2)}
                      className="flex-1"
                    >
                      Back to Payment
                    </Button>
                    <Button
                      size="lg"
                      onClick={handlePlaceOrder}
                      disabled={!agreedToTerms}
                      className="flex-1"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Place Order
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{item.quantity}x</span>
                    <span className="flex-1 truncate">{item.name}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    And {items.length - 3} more items...
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}</span>
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

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Secure SSL Checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>30-Day Return Policy</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Secure Packaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Badge component for Wise
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 text-xs font-medium rounded", className)}>
      {children}
    </span>
  )
}