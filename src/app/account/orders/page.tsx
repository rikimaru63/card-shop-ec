"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface OrderItem {
  id: string
  quantity: number
  price: number
  total: number
  snapshot: {
    name: string
    price: number
    image: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  subtotal: number
  shipping: number
  total: number
  currency: string
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  trackingNumber: string | null
  items: OrderItem[]
  shippingAddress: {
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
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: "支払い待ち", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  PROCESSING: { label: "処理中", color: "bg-blue-100 text-blue-800", icon: Package },
  SHIPPED: { label: "発送済み", color: "bg-purple-100 text-purple-800", icon: Truck },
  DELIVERED: { label: "配達完了", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "キャンセル", color: "bg-red-100 text-red-800", icon: XCircle },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "未払い", color: "bg-yellow-100 text-yellow-800" },
  PROCESSING: { label: "処理中", color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "支払い済み", color: "bg-green-100 text-green-800" },
  FAILED: { label: "失敗", color: "bg-red-100 text-red-800" },
  CANCELLED: { label: "キャンセル", color: "bg-gray-100 text-gray-800" },
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/account/orders")
    }
  }, [status, router])

  useEffect(() => {
    const fetchOrders = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch(`/api/orders?userId=${session.user.id}`)
          if (response.ok) {
            const data = await response.json()
            setOrders(data.orders || [])
          }
        } catch (error) {
          console.error("Failed to fetch orders:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (session?.user?.id) {
      fetchOrders()
    }
  }, [session?.user?.id])

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "コピーしました",
      description: "クリップボードにコピーしました",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            アカウントに戻る
          </Link>
          <h1 className="text-3xl font-bold">注文履歴</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">注文履歴がありません</h2>
            <p className="text-muted-foreground mb-6">
              まだ注文がありません。商品を探してみましょう。
            </p>
            <Link href="/products">
              <Button>商品を見る</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id)
              const StatusIcon = statusConfig[order.status]?.icon || Clock

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg border shadow-sm overflow-hidden"
                >
                  {/* Order Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <StatusIcon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-mono font-semibold">{order.orderNumber}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(order.orderNumber)
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            ¥{Number(order.total).toLocaleString()}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusConfig[order.status]?.color || 'bg-gray-100'}`}>
                              {statusConfig[order.status]?.label || order.status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${paymentStatusConfig[order.paymentStatus]?.color || 'bg-gray-100'}`}>
                              {paymentStatusConfig[order.paymentStatus]?.label || order.paymentStatus}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    {!isExpanded && (
                      <div className="flex items-center gap-2 mt-3">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="relative w-12 h-12 rounded bg-gray-100 overflow-hidden"
                          >
                            <Image
                              src={item.snapshot.image || "/placeholder.png"}
                              alt={item.snapshot.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-sm text-muted-foreground">
                            +{order.items.length - 3}
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground ml-2">
                          {order.items.length}点の商品
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t">
                      {/* Order Items */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold mb-3">注文内容</h3>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                              <Image
                                src={item.snapshot.image || "/placeholder.png"}
                                alt={item.snapshot.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.snapshot.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ¥{Number(item.price).toLocaleString()} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">
                              ¥{Number(item.total).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Order Summary */}
                      <div className="p-4 bg-gray-50 border-t">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Price Summary */}
                          <div>
                            <h3 className="font-semibold mb-3">金額詳細</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>小計</span>
                                <span>¥{Number(order.subtotal).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>送料</span>
                                <span>
                                  {Number(order.shipping) === 0
                                    ? "無料"
                                    : `¥${Number(order.shipping).toLocaleString()}`
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between font-bold text-base pt-2 border-t">
                                <span>合計</span>
                                <span>¥{Number(order.total).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <h3 className="font-semibold mb-3">配送先</h3>
                            <div className="text-sm text-muted-foreground">
                              <p className="font-medium text-foreground">
                                {order.shippingAddress.lastName} {order.shippingAddress.firstName}
                              </p>
                              <p>〒{order.shippingAddress.postalCode}</p>
                              <p>
                                {order.shippingAddress.state}
                                {order.shippingAddress.city}
                                {order.shippingAddress.street1}
                              </p>
                              {order.shippingAddress.street2 && (
                                <p>{order.shippingAddress.street2}</p>
                              )}
                              {order.shippingAddress.phone && (
                                <p>TEL: {order.shippingAddress.phone}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tracking Info */}
                        {order.trackingNumber && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="font-semibold mb-2">追跡情報</h3>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{order.trackingNumber}</span>
                              <button
                                onClick={() => copyToClipboard(order.trackingNumber!)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Payment Action for Pending Orders */}
                        {order.status === "PENDING" && order.paymentStatus === "PENDING" && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <p className="text-sm text-amber-800 mb-3">
                                お支払いがまだ完了していません。Wiseでお支払いください。
                              </p>
                              <a
                                href="https://wise.com/pay/business/kms22"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button className="bg-green-600 hover:bg-green-700">
                                  Wiseで支払う
                                  <ExternalLink className="h-4 w-4 ml-2" />
                                </Button>
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
