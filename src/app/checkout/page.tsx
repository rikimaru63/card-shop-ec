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
  Truck,
  Check,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCartStore } from "@/store/cart-store"
import { createOrder, getUserAddresses } from "./actions"
import { toast } from "@/hooks/use-toast"
import { CustomsNotice } from "@/components/CustomsNotice"

const baseCountries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "JP", name: "Japan" },
  { code: "SG", name: "Singapore" },
  { code: "HK", name: "Hong Kong" },
  { code: "TW", name: "Taiwan" },
  { code: "KR", name: "South Korea" },
  { code: "NZ", name: "New Zealand" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
]

const euOnlyCountries = [
  { code: "CZ", name: "Czech Republic" },
]

const region = process.env.NEXT_PUBLIC_REGION || "US"
const countries = region === "EU"
  ? [...baseCountries, ...euOnlyCountries].sort((a, b) => a.name.localeCompare(b.name))
  : baseCountries

interface SavedAddress {
  id: string
  firstName: string
  lastName: string
  company?: string | null
  street1: string
  street2?: string | null
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string | null
  isDefault: boolean
}

interface ShippingAddress {
  firstName: string
  lastName: string
  company?: string
  street1: string
  street2?: string
  street3?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
  email?: string
  isResidential?: boolean
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    items,
    getTotalPrice,
    getCustomsFee,
    getTotalItems,
    clearCart,
    getBoxCount,
    getShippingInfo,
    hasBoxItems,
    isBoxOrderValid
  } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressMode, setAddressMode] = useState<"registered" | "new">("registered")
  const [saveAddress, setSaveAddress] = useState(true)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

  // New address form (FedEx format)
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    company: "",
    street1: "",
    street2: "",
    street3: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
    phone: "",
    email: "",
    isResidential: false,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load saved addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (session?.user?.id) {
        try {
          const addresses = await getUserAddresses(session.user.id)
          setSavedAddresses(addresses as SavedAddress[])
          const defaultAddr = addresses.find((a: SavedAddress) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
            setAddressMode("registered")
          } else if (addresses.length > 0) {
            setSelectedAddressId(addresses[0].id)
            setAddressMode("registered")
          } else {
            setAddressMode("new")
          }
        } catch (error) {
          console.error("Failed to load addresses:", error)
        } finally {
          setLoadingAddresses(false)
        }
      } else {
        setLoadingAddresses(false)
        setAddressMode("new")
      }
    }
    if (mounted && status === "authenticated") {
      loadAddresses()
    }
  }, [session?.user?.id, mounted, status])

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/checkout")
    }
  }, [status, router])

  const getSelectedAddress = (): ShippingAddress | null => {
    if (addressMode === "new") {
      if (!newAddress.firstName || !newAddress.street1 ||
          !newAddress.city || !newAddress.state || !newAddress.postalCode || !newAddress.country) {
        return null
      }
      return newAddress
    }

    const selected = savedAddresses.find(a => a.id === selectedAddressId)
    if (!selected) return null

    return {
      firstName: selected.firstName,
      lastName: selected.lastName,
      company: selected.company || undefined,
      street1: selected.street1,
      street2: selected.street2 || undefined,
      city: selected.city,
      state: selected.state,
      postalCode: selected.postalCode,
      country: selected.country,
      phone: selected.phone || undefined
    }
  }

  const handleConfirmOrder = async () => {
    if (!session?.user?.email) return

    const address = getSelectedAddress()
    if (!address) {
      toast({
        title: "Please enter shipping address",
        description: "All required fields must be filled",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
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
        shippingAddress: address,
        saveAddress: addressMode === "new" && saveAddress
      })

      if (result.success && result.orderNumber) {
        clearCart()
        router.push(`/checkout/payment/${result.orderNumber}`)
      } else {
        toast({
          title: "Error",
          description: result.message || "Order failed",
          variant: "destructive"
        })
        setIsSubmitting(false)
      }
    } catch (error) {
      console.error("Order error:", error)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive"
      })
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

  if (!session) {
    return null
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
                Please add items to your cart.
              </p>
              <Link href="/">
                <Button size="lg">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = getTotalPrice()
  const customsFee = getCustomsFee()
  const shippingInfo = getShippingInfo()
  const shipping = shippingInfo.shipping
  const total = subtotal + customsFee + shipping

  const boxCount = getBoxCount()
  const hasBox = hasBoxItems()
  const boxOrderValid = isBoxOrderValid()
  const boxNeeded = hasBox && !boxOrderValid ? 5 - boxCount : 0

  const isAddressValid = () => {
    if (addressMode === "new") {
      return newAddress.firstName && newAddress.street1 &&
             newAddress.city && newAddress.state && newAddress.postalCode && newAddress.country
    }
    return selectedAddressId !== null
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
                      <p className="font-semibold">¥{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* BOX Warning */}
                {hasBox && !boxOrderValid && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-800 text-sm">
                          Minimum 5 BOX required per order
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          Current: {boxCount} BOX ({boxNeeded} more needed)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({getTotalItems()} items)</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Customs Fee (20%)</span>
                    <span>¥{customsFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className={shippingInfo.isFreeShipping ? "text-green-600 font-semibold" : ""}>
                      {shipping === 0 ? "FREE" : `¥${shipping.toLocaleString()}`}
                    </span>
                  </div>
                  {!shippingInfo.isFreeShipping && shippingInfo.singleBoxTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      * Add ¥{(50000 - shippingInfo.singleBoxTotal).toLocaleString()} more for free shipping
                    </p>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-primary">¥{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Card (FedEx format) */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Shipping Address</h2>
                  <span className="text-red-500 text-sm">*Required</span>
                </div>

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Address Mode Selection */}
                    {savedAddresses.length > 0 && (
                      <div className="space-y-3 mb-6">
                        {/* Option 1: Registered Address */}
                        <div
                          onClick={() => setAddressMode("registered")}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            addressMode === "registered"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              addressMode === "registered" ? "border-primary" : "border-gray-300"
                            }`}>
                              {addressMode === "registered" && (
                                <div className="w-3 h-3 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium">Use saved address</span>
                          </div>
                          {addressMode === "registered" && (
                            <div className="mt-4 ml-8 space-y-2">
                              {savedAddresses.map((address) => (
                                <div
                                  key={address.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedAddressId(address.id)
                                  }}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedAddressId === address.id
                                      ? "border-primary bg-white"
                                      : "border-gray-200 hover:border-gray-300 bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-medium text-sm">
                                        {address.firstName} {address.lastName}
                                        {address.isDefault && (
                                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            Default
                                          </span>
                                        )}
                                      </p>
                                      {address.company && (
                                        <p className="text-xs text-muted-foreground">{address.company}</p>
                                      )}
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {address.street1}
                                        {address.street2 && `, ${address.street2}`}
                                        {`, ${address.city}, ${address.state} ${address.postalCode}`}
                                      </p>
                                    </div>
                                    {selectedAddressId === address.id && (
                                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Option 2: Different Address */}
                        <div
                          onClick={() => setAddressMode("new")}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            addressMode === "new"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              addressMode === "new" ? "border-primary" : "border-gray-300"
                            }`}>
                              {addressMode === "new" && (
                                <div className="w-3 h-3 rounded-full bg-primary" />
                              )}
                            </div>
                            <span className="font-medium">Ship to a different address</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* New Address Form (FedEx format) */}
                    {(addressMode === "new" || savedAddresses.length === 0) && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="contactName">Contact Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="contactName"
                            value={newAddress.firstName}
                            onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
                            placeholder="John Doe"
                          />
                        </div>

                        <div>
                          <Label htmlFor="companyName">Company Name (optional)</Label>
                          <Input
                            id="companyName"
                            value={newAddress.company}
                            onChange={(e) => setNewAddress({...newAddress, company: e.target.value})}
                            placeholder="Company Inc."
                          />
                          <p className="text-xs text-muted-foreground mt-1">If left blank, your account name will be used</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                            <Input
                              id="phone"
                              value={newAddress.phone}
                              onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                              placeholder="+1 234 567 8900"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newAddress.email}
                              onChange={(e) => setNewAddress({...newAddress, email: e.target.value})}
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="country">Country / Region <span className="text-red-500">*</span></Label>
                          <Select
                            value={newAddress.country}
                            onValueChange={(value) => setNewAddress({...newAddress, country: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="street1">Address Line 1 <span className="text-red-500">*</span></Label>
                          <Input
                            id="street1"
                            value={newAddress.street1}
                            onChange={(e) => setNewAddress({...newAddress, street1: e.target.value})}
                            placeholder="123 Main St"
                          />
                        </div>

                        <div>
                          <Label htmlFor="street2">Address Line 2</Label>
                          <Input
                            id="street2"
                            value={newAddress.street2}
                            onChange={(e) => setNewAddress({...newAddress, street2: e.target.value})}
                            placeholder="Apt, Suite, Unit, etc."
                          />
                        </div>

                        <div>
                          <Label htmlFor="street3">Address Line 3</Label>
                          <Input
                            id="street3"
                            value={newAddress.street3}
                            onChange={(e) => setNewAddress({...newAddress, street3: e.target.value})}
                            placeholder="Additional address info"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                            <Input
                              id="city"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                              placeholder="Los Angeles"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State / Province <span className="text-red-500">*</span></Label>
                            <Input
                              id="state"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                              placeholder="CA"
                            />
                          </div>
                          <div>
                            <Label htmlFor="postalCode">ZIP Code <span className="text-red-500">*</span></Label>
                            <Input
                              id="postalCode"
                              value={newAddress.postalCode}
                              onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
                              placeholder="90001"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="isResidential"
                            checked={newAddress.isResidential}
                            onCheckedChange={(checked) => setNewAddress({...newAddress, isResidential: checked === true})}
                          />
                          <Label htmlFor="isResidential" className="text-sm cursor-pointer">
                            This is a residential address
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="saveAddress"
                            checked={saveAddress}
                            onCheckedChange={(checked) => setSaveAddress(checked === true)}
                          />
                          <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                            Save this address for future orders
                          </Label>
                        </div>
                      </div>
                    )}
                  </>
                )}
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
                      <p className="font-semibold text-green-900">Wise Payment</p>
                      <p className="text-sm text-green-700">Low fees, fast international transfers</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800 mt-3">
                    After confirming your order, a QR code will be displayed for payment via Wise.
                  </p>
                </div>
              </div>

              {/* Customs Notice */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <CustomsNotice />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-6">Place Order</h2>

                {/* BOX Warning in Sidebar */}
                {hasBox && !boxOrderValid && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <p className="text-sm text-orange-800">
                        Minimum 5 BOX required
                      </p>
                    </div>
                  </div>
                )}

                {/* Fee notice */}
                <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Please note: Fees may apply for payments and cancellations.
                  </p>
                </div>

                {/* Main CTA */}
                <Button
                  className="w-full mb-4"
                  size="lg"
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !isAddressValid() || !boxOrderValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : !boxOrderValid ? (
                    "Add 5+ BOX to continue"
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Order
                    </>
                  )}
                </Button>

                {!isAddressValid() && boxOrderValid && (
                  <p className="text-sm text-red-500 text-center mb-4">
                    Please enter your shipping address
                  </p>
                )}

                {/* Secondary CTA */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleInstagramInquiry}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact via Instagram
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
                    <span>Worldwide shipping</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Careful packaging</span>
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
