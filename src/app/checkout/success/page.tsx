"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { CheckCircle, Package, Mail, ArrowRight, CreditCard, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

// Wise Pay Link URL
const WISE_PAY_URL = "https://wise.com/pay/business/kms22"

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "コピーしました",
      description: "クリップボードにコピーしました",
    })
  }

  const orderNumber = order?.orderNumber || `ORD-${Date.now().toString().slice(-8)}`
  const totalAmount = order ? Number(order.total) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">ご注文ありがとうございます!</h1>
            <p className="text-muted-foreground">
              ご注文が完了しました。以下の方法でお支払いください。
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-1">注文番号</p>
              <p className="text-xl font-mono font-bold">{orderNumber}</p>
            </div>

            {totalAmount > 0 && (
              <div className="text-center mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">お支払い金額</p>
                <p className="text-3xl font-bold text-primary">¥{totalAmount.toLocaleString()}</p>
              </div>
            )}

            {order?.items && (
              <div className="border-t pt-4 mb-4">
                <p className="text-sm text-muted-foreground mb-2">ご注文内容</p>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.product.name} × {item.quantity}</span>
                      <span>¥{(Number(item.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Wise QR Payment Section */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="text-center mb-4">
              <CreditCard className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h2 className="text-xl font-bold">お支払い方法</h2>
              <p className="text-sm text-muted-foreground">
                Wise（ワイズ）でのお支払いをお願いいたします
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center mb-6">
              <div className="p-4 bg-white border-2 border-blue-100 rounded-xl mb-4">
                <QRCodeSVG
                  value={WISE_PAY_URL}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                スマートフォンでQRコードをスキャンしてお支払いください
              </p>
            </div>

            {/* Payment Link */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium mb-2">または以下のリンクからお支払い:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded text-sm overflow-x-auto">
                  {WISE_PAY_URL}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(WISE_PAY_URL)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <a href={WISE_PAY_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="font-semibold text-amber-800 mb-2">お支払い時の注意事項</h3>
              <ul className="space-y-2 text-sm text-amber-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>お支払い金額: <strong>¥{totalAmount.toLocaleString()}</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>送金時のメモ欄に注文番号 <strong>{orderNumber}</strong> を必ずご記入ください</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>お支払い確認後、商品の発送準備を開始いたします</span>
                </li>
              </ul>
            </div>

            {/* Copy Order Number Button */}
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(orderNumber)}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                注文番号をコピー
              </Button>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold mb-3">次のステップ</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Package className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>上記のQRコードまたはリンクからWiseでお支払いください</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>お支払い確認後、確認メールをお送りいたします</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>発送後、追跡番号をメールでお知らせします</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products" className="flex-1">
              <Button className="w-full" size="lg">
                買い物を続ける
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/account/orders" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                注文履歴を見る
              </Button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>
              ご不明な点がございましたら{" "}
              <a href="mailto:support@cardshop.com" className="text-primary underline">
                support@cardshop.com
              </a>
              {" "}までお問い合わせください
            </p>
          </div>
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
          <p>読み込み中...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
