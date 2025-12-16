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
  Copy
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { createOrder } from "./actions"
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
        // Save order details before clearing cart
        const currentTotal = getTotalPrice()
        const shipping = currentTotal > 10000 ? 0 : 1500
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

  // Generate Wise payment URL with amount
  const getWisePaymentUrl = () => {
    const amount = Math.round(orderTotal)
    return `${WISE_PAY_BASE_URL}?amount=${amount}&currency=JPY&description=${encodeURIComponent(`注文番号: ${orderNumber}`)}`
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

                {/* QR Code */}
                <div className="flex flex-col items-center mb-4">
                  <div className="p-4 bg-white border-2 border-green-100 rounded-xl mb-3">
                    <QRCodeSVG
                      value={wiseUrl}
                      size={180}
                      level="H"
                      includeMargin={true}
                      imageSettings={{
                        src: "/wise-logo.png",
                        height: 30,
                        width: 30,
                        excavate: true,
                      }}
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
                    Wiseで支払う（¥{orderTotal.toLocaleString()}）
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </a>

                {/* Instructions */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>注意：</strong> 送金時のメモ欄に注文番号「{orderNumber}」を必ずご記入ください。
                  </p>
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
  const shipping = subtotal > 10000 ? 0 : 1500
  const total = subtotal + shipping

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
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    注文確定後にお送りするメールに配送先住所をご返信ください。または、こちらからご連絡いたします。
                  </p>
                </div>
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
                  disabled={isSubmitting}
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
