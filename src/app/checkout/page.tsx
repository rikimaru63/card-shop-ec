"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
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
  Copy,
  Plus,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useCartStore } from "@/store/cart-store"
import { createOrder, getUserAddresses } from "./actions"
import { toast } from "@/hooks/use-toast"

// Wise Pay Link base URL
const WISE_PAY_BASE_URL = "https://wise.com/pay/business/kms22"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface SavedAddress {
  id: string
  firstName: string
  lastName: string
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
  street1: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [orderTotal, setOrderTotal] = useState<number>(0)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [saveAddress, setSaveAddress] = useState(true)
  const [loadingAddresses, setLoadingAddresses] = useState(true)

  // New address form
  const [newAddress, setNewAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "日本",
    phone: ""
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
          // Select default address if exists
          const defaultAddr = addresses.find((a: SavedAddress) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
          } else if (addresses.length === 0) {
            setShowNewAddressForm(true)
          }
        } catch (error) {
          console.error("Failed to load addresses:", error)
        } finally {
          setLoadingAddresses(false)
        }
      } else {
        setLoadingAddresses(false)
        setShowNewAddressForm(true)
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
    if (showNewAddressForm) {
      // Validate new address
      if (!newAddress.firstName || !newAddress.lastName || !newAddress.street1 ||
          !newAddress.city || !newAddress.state || !newAddress.postalCode) {
        return null
      }
      return newAddress
    }

    const selected = savedAddresses.find(a => a.id === selectedAddressId)
    if (!selected) return null

    return {
      firstName: selected.firstName,
      lastName: selected.lastName,
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
        title: "配送先住所を入力してください",
        description: "すべての必須項目を入力してください",
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
        saveAddress: showNewAddressForm && saveAddress
      })

      if (result.success && result.orderNumber) {
        const currentTotal = getTotalPrice()
        const shipping = currentTotal >= 10000 ? 0 : 1500
        setOrderTotal(currentTotal + shipping)
        setOrderItems([...items])
        setOrderNumber(result.orderNumber)
        setOrderComplete(true)
        clearCart()
        toast({
          title: "ご注文ありがとうございます！",
          description: "下記のQRコードからお支払いください。",
        })
      } else {
        toast({
          title: "エラー",
          description: result.message || "注文に失敗しました",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Order error:", error)
      toast({
        title: "エラー",
        description: "エラーが発生しました。もう一度お試しください。",
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

  const getWisePaymentUrl = () => {
    return WISE_PAY_BASE_URL
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "コピーしました",
      description: "クリップボードにコピーしました",
    })
  }

  // Order Complete State
  if (orderComplete) {
    const wiseUrl = getWisePaymentUrl()

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-2">ご注文確定！</h1>
              <p className="text-muted-foreground">
                ご注文ありがとうございます。下記のQRコードからお支払いください。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Order Details */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  ご注文内容
                </h2>

                {orderNumber && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-muted-foreground">注文番号</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-bold">{orderNumber}</p>
                      <button
                        onClick={() => copyToClipboard(orderNumber)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        ¥{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">お支払い金額</span>
                    <span className="text-2xl font-bold text-green-600">
                      ¥{orderTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: QR Code Payment */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Wiseでお支払い
                </h2>

                {/* Amount to pay */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-center">
                  <p className="text-sm text-green-700 mb-1">お支払い金額</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-bold text-green-600">¥{orderTotal.toLocaleString()}</p>
                    <button
                      onClick={() => copyToClipboard(orderTotal.toString())}
                      className="text-green-500 hover:text-green-700"
                      title="金額をコピー"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center mb-4">
                  <div className="p-4 bg-white border-2 border-green-100 rounded-xl mb-3">
                    <QRCodeSVG
                      value={wiseUrl}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    スマートフォンでスキャン
                  </p>
                </div>

                {/* Payment Button */}
                <a
                  href={wiseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                    Wiseを開く
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>

                {/* Instructions */}
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-semibold text-amber-900 mb-2">お支払い時の入力内容：</p>
                    <div className="space-y-2 text-sm text-amber-800">
                      <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                        <span>金額：</span>
                        <span className="font-mono font-bold">¥{orderTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                        <span>説明欄：</span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-xs">{orderNumber}</span>
                          <button
                            onClick={() => copyToClipboard(orderNumber || '')}
                            className="text-amber-600 hover:text-amber-800"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h3 className="font-semibold text-blue-900 mb-3">次に何が起こりますか？</h3>
              <ol className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>上記のQRコードまたはボタンからWiseでお支払いください</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>お支払い確認後、商品の発送準備を開始します</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>発送完了後、追跡番号をメールでお送りします</span>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mt-8">
              <Link href="/account/orders">
                <Button variant="outline">注文履歴を見る</Button>
              </Link>
              <Link href="/products">
                <Button>買い物を続ける</Button>
              </Link>
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
              <h1 className="text-2xl font-bold mb-4">カートは空です</h1>
              <p className="text-muted-foreground mb-8">
                商品をカートに追加してください。
              </p>
              <Link href="/products">
                <Button size="lg">買い物を続ける</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = getTotalPrice()
  const shipping = subtotal >= 10000 ? 0 : 1500
  const total = subtotal + shipping

  const isAddressValid = () => {
    if (showNewAddressForm) {
      return newAddress.firstName && newAddress.lastName && newAddress.street1 &&
             newAddress.city && newAddress.state && newAddress.postalCode
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
            カートに戻る
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">ご注文確認</h1>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">ご注文内容</h2>
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
                        <p className="text-sm text-muted-foreground">数量: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">¥{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>小計 ({getTotalItems()}点)</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>送料</span>
                    <span>{shipping === 0 ? "無料" : `¥${shipping.toLocaleString()}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>合計</span>
                    <span className="text-primary">¥{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address Card */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">配送先住所</h2>
                  <span className="text-red-500 text-sm">*必須</span>
                </div>

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Saved Addresses */}
                    {savedAddresses.length > 0 && !showNewAddressForm && (
                      <div className="space-y-3 mb-4">
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            onClick={() => setSelectedAddressId(address.id)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedAddressId === address.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">
                                  {address.lastName} {address.firstName}
                                  {address.isDefault && (
                                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      デフォルト
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  〒{address.postalCode}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {address.state}{address.city}{address.street1}
                                  {address.street2 && ` ${address.street2}`}
                                </p>
                                {address.phone && (
                                  <p className="text-sm text-muted-foreground">
                                    TEL: {address.phone}
                                  </p>
                                )}
                              </div>
                              {selectedAddressId === address.id && (
                                <Check className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => setShowNewAddressForm(true)}
                          className="w-full p-4 border border-dashed border-gray-300 rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          新しい住所を追加
                        </button>
                      </div>
                    )}

                    {/* New Address Form */}
                    {showNewAddressForm && (
                      <div className="space-y-4">
                        {savedAddresses.length > 0 && (
                          <button
                            onClick={() => setShowNewAddressForm(false)}
                            className="text-sm text-primary hover:underline mb-2"
                          >
                            ← 保存済みの住所から選択
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="lastName">姓 <span className="text-red-500">*</span></Label>
                            <Input
                              id="lastName"
                              value={newAddress.lastName}
                              onChange={(e) => setNewAddress({...newAddress, lastName: e.target.value})}
                              placeholder="山田"
                            />
                          </div>
                          <div>
                            <Label htmlFor="firstName">名 <span className="text-red-500">*</span></Label>
                            <Input
                              id="firstName"
                              value={newAddress.firstName}
                              onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
                              placeholder="太郎"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="postalCode">郵便番号 <span className="text-red-500">*</span></Label>
                          <Input
                            id="postalCode"
                            value={newAddress.postalCode}
                            onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
                            placeholder="123-4567"
                          />
                        </div>

                        <div>
                          <Label htmlFor="state">都道府県 <span className="text-red-500">*</span></Label>
                          <Input
                            id="state"
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                            placeholder="東京都"
                          />
                        </div>

                        <div>
                          <Label htmlFor="city">市区町村 <span className="text-red-500">*</span></Label>
                          <Input
                            id="city"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            placeholder="渋谷区"
                          />
                        </div>

                        <div>
                          <Label htmlFor="street1">番地・建物名 <span className="text-red-500">*</span></Label>
                          <Input
                            id="street1"
                            value={newAddress.street1}
                            onChange={(e) => setNewAddress({...newAddress, street1: e.target.value})}
                            placeholder="渋谷1-2-3 ABCビル101"
                          />
                        </div>

                        <div>
                          <Label htmlFor="street2">建物名・部屋番号（任意）</Label>
                          <Input
                            id="street2"
                            value={newAddress.street2}
                            onChange={(e) => setNewAddress({...newAddress, street2: e.target.value})}
                            placeholder=""
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone">電話番号（任意）</Label>
                          <Input
                            id="phone"
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                            placeholder="090-1234-5678"
                          />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="saveAddress"
                            checked={saveAddress}
                            onCheckedChange={(checked) => setSaveAddress(checked === true)}
                          />
                          <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                            この住所を保存して次回から使用する
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
                  <h2 className="text-lg font-semibold">お支払い方法</h2>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <div>
                      <p className="font-semibold text-green-900">Wise決済</p>
                      <p className="text-sm text-green-700">低手数料・迅速な国際送金</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-800 mt-3">
                    注文確定後、決済用のQRコードが表示されます。Wiseで安全にお支払いください。
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-6">ご注文を確定する</h2>

                {/* Main CTA */}
                <Button
                  className="w-full mb-4"
                  size="lg"
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !isAddressValid()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      注文を確定する
                    </>
                  )}
                </Button>

                {!isAddressValid() && (
                  <p className="text-sm text-red-500 text-center mb-4">
                    配送先住所を入力してください
                  </p>
                )}

                {/* Secondary CTA */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleInstagramInquiry}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Instagramでお問い合わせ
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>

                {/* Trust badges */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>安全な決済</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>¥10,000以上で送料無料</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>丁寧な梱包でお届け</span>
                  </div>
                </div>

                {/* User info */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground">
                    ログイン中: <span className="font-medium">{session.user?.email}</span>
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
