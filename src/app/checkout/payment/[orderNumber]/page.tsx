"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  XCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { confirmPayment, getOrderByNumber, cancelOrder } from "@/app/checkout/actions"
import { useToast } from "@/hooks/use-toast"

const WISE_PAY_BASE_URL = "https://wise.com/pay/business/kms22"

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const orderNumber = params.orderNumber as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [expired, setExpired] = useState(false)
  const [copiedAmount, setCopiedAmount] = useState(false)
  const [copiedOrder, setCopiedOrder] = useState(false)

  // Fetch order details
  useEffect(() => {
    async function fetchOrder() {
      const orderData = await getOrderByNumber(orderNumber)
      if (!orderData) {
        router.push("/account/orders")
        return
      }

      // If payment already processed, redirect
      if (orderData.paymentStatus === "PROCESSING" || orderData.paymentStatus === "COMPLETED") {
        router.push(`/checkout/success?orderNumber=${orderNumber}`)
        return
      }

      // If cancelled, redirect
      if (orderData.status === "CANCELLED") {
        router.push("/account/orders")
        return
      }

      setOrder(orderData)
      setLoading(false)
    }

    fetchOrder()
  }, [orderNumber, router])

  // Countdown timer
  useEffect(() => {
    if (!order?.reservationExpiresAt) return

    const calculateTimeRemaining = () => {
      const expiresAt = new Date(order.reservationExpiresAt).getTime()
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))

      if (remaining <= 0) {
        setExpired(true)
        setTimeRemaining(0)
      } else {
        setTimeRemaining(remaining)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [order?.reservationExpiresAt])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleConfirmPayment = async () => {
    setConfirming(true)

    const result = await confirmPayment(orderNumber)

    if (result.success) {
      toast({
        title: "決済確認完了",
        description: "ご注文ありがとうございます。入金確認後、発送準備を開始します。"
      })
      router.push(`/checkout/success?orderNumber=${orderNumber}`)
    } else {
      toast({
        title: "エラー",
        description: result.message || "決済確認に失敗しました",
        variant: "destructive"
      })
      setConfirming(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!confirm("注文をキャンセルしますか？在庫は解放されます。")) return

    const result = await cancelOrder(orderNumber)

    if (result.success) {
      toast({
        title: "注文キャンセル",
        description: "注文がキャンセルされました"
      })
      router.push("/cart")
    } else {
      toast({
        title: "エラー",
        description: result.message || "キャンセルに失敗しました",
        variant: "destructive"
      })
    }
  }

  const copyToClipboard = async (text: string, type: "amount" | "order") => {
    await navigator.clipboard.writeText(text)
    if (type === "amount") {
      setCopiedAmount(true)
      setTimeout(() => setCopiedAmount(false), 2000)
    } else {
      setCopiedOrder(true)
      setTimeout(() => setCopiedOrder(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return null
  }

  const wiseUrl = `${WISE_PAY_BASE_URL}?amount=${order.total}&currency=JPY&description=${encodeURIComponent(`Order: ${orderNumber}`)}`

  // Expired state
  if (expired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Time Expired
          </h1>
          <p className="text-gray-600 mb-6">
            在庫予約の有効期限が切れました。<br />
            注文は自動的にキャンセルされます。
          </p>
          <div className="space-y-3">
            <Link href="/cart">
              <Button className="w-full">
                カートに戻る
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full">
                商品一覧へ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Timer Warning */}
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          timeRemaining <= 300
            ? "bg-red-100 text-red-800"
            : timeRemaining <= 600
            ? "bg-yellow-100 text-yellow-800"
            : "bg-blue-100 text-blue-800"
        }`}>
          {timeRemaining <= 300 ? (
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Clock className="h-5 w-5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium">
              残り時間: {formatTime(timeRemaining)}
            </p>
            <p className="text-sm opacity-80">
              {timeRemaining <= 300
                ? "時間内に決済を完了してください！"
                : "30分以内にWiseで支払いを完了し、「決済完了」ボタンを押してください"}
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white p-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Wise Payment</h1>
            <p className="opacity-90">
              Order: {orderNumber}
            </p>
          </div>

          {/* QR Code Section */}
          <div className="p-6 border-b">
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg shadow-inner border mb-4">
                <QRCodeSVG
                  value={wiseUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Scan with your phone to pay via Wise
              </p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Amount to Pay</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-600">
                  ¥{Number(order.total).toLocaleString()}
                </span>
                <button
                  onClick={() => copyToClipboard(String(order.total), "amount")}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {copiedAmount ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Order Number</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{orderNumber}</span>
                <button
                  onClick={() => copyToClipboard(orderNumber, "order")}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {copiedOrder ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Payment Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>QRコードをスキャンするか、下のボタンでWiseを開く</li>
                <li>上記の金額を送金する</li>
                <li>送金完了後、「決済完了」ボタンを押す</li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-gray-50 space-y-3">
            <a
              href={wiseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                Open Wise
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </a>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleConfirmPayment}
              disabled={confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  決済完了
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-gray-500 hover:text-red-600"
              onClick={handleCancelOrder}
            >
              注文をキャンセル
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {(item.snapshot as any)?.name || "Item"} × {item.quantity}
                </span>
                <span>¥{Number(item.total).toLocaleString()}</span>
              </div>
            ))}
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>¥{Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customs Fee (20%)</span>
                <span>¥{Number(order.customsFee || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>
                  {Number(order.shipping) === 0 ? "Free" : `¥${Number(order.shipping).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>¥{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
