"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard
} from "lucide-react"
import { Label } from "@/components/ui/label"

export const dynamic = 'force-dynamic'

interface OrderItem {
  id: string
  quantity: number
  price: number
  total: number
  product: {
    id: string
    name: string
    images: { url: string }[]
  }
}

interface Order {
  id: string
  orderNumber: string
  email: string
  total: number
  status: string
  paymentStatus: string
  trackingNumber: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  } | null
  items: OrderItem[]
  payment: {
    id: string
    method: string
    status: string
  } | null
}

const orderStatusLabels: Record<string, string> = {
  PENDING: "保留中",
  PROCESSING: "処理中",
  SHIPPED: "発送済み",
  DELIVERED: "配達完了",
  CANCELLED: "キャンセル",
  REFUNDED: "返金済み"
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: "未払い",
  PROCESSING: "処理中",
  COMPLETED: "支払済み",
  FAILED: "失敗",
  CANCELLED: "キャンセル",
  REFUNDED: "返金済み"
}

const orderStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-red-100 text-red-800"
}

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  REFUNDED: "bg-orange-100 text-orange-800"
}

const orderStatusIcons: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-4 w-4" />,
  PROCESSING: <Package className="h-4 w-4" />,
  SHIPPED: <Truck className="h-4 w-4" />,
  DELIVERED: <CheckCircle className="h-4 w-4" />,
  CANCELLED: <XCircle className="h-4 w-4" />,
  REFUNDED: <XCircle className="h-4 w-4" />
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [newPaymentStatus, setNewPaymentStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter)
      if (paymentFilter && paymentFilter !== "all") params.set('paymentStatus', paymentFilter)
      params.set('page', page.toString())

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()

      setOrders(data.orders || [])
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
    } catch (error) {
      toast({
        title: "エラー",
        description: "注文の取得に失敗しました",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, paymentFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrders()
  }

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setDetailDialogOpen(true)
  }

  const handleEditStatus = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setNewPaymentStatus(order.paymentStatus)
    setTrackingNumber(order.trackingNumber || "")
    setUpdateDialogOpen(true)
  }

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return

    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          trackingNumber: trackingNumber || null
        })
      })

      if (response.ok) {
        toast({
          title: "成功",
          description: "注文を更新しました"
        })
        setUpdateDialogOpen(false)
        fetchOrders()
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "注文の更新に失敗しました",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">注文管理</h1>
        <span className="text-gray-500">{total}件の注文</span>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="注文番号、メールで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">検索</Button>
        </form>

        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="注文状態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="PENDING">保留中</SelectItem>
            <SelectItem value="PROCESSING">処理中</SelectItem>
            <SelectItem value="SHIPPED">発送済み</SelectItem>
            <SelectItem value="DELIVERED">配達完了</SelectItem>
            <SelectItem value="CANCELLED">キャンセル</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={(value) => { setPaymentFilter(value); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="支払状態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="PENDING">未払い</SelectItem>
            <SelectItem value="COMPLETED">支払済み</SelectItem>
            <SelectItem value="FAILED">失敗</SelectItem>
            <SelectItem value="REFUNDED">返金済み</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>注文番号</TableHead>
              <TableHead>顧客</TableHead>
              <TableHead>商品</TableHead>
              <TableHead>合計金額</TableHead>
              <TableHead>注文状態</TableHead>
              <TableHead>支払状態</TableHead>
              <TableHead>注文日</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  読み込み中...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  注文が見つかりません
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    #{order.orderNumber.slice(-8)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.user?.name || "ゲスト"}</p>
                      <p className="text-sm text-gray-500">{order.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.items[0]?.product.images[0] && (
                        <Image
                          src={order.items[0].product.images[0].url}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded"
                        />
                      )}
                      <div>
                        <p className="text-sm">{order.items[0]?.product.name}</p>
                        {order.items.length > 1 && (
                          <p className="text-xs text-gray-500">他{order.items.length - 1}件</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ¥{Number(order.total).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={orderStatusColors[order.status]}>
                      <span className="mr-1">{orderStatusIcons[order.status]}</span>
                      {orderStatusLabels[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={paymentStatusColors[order.paymentStatus]}>
                      <CreditCard className="h-3 w-3 mr-1" />
                      {paymentStatusLabels[order.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStatus(order)}
                      >
                        更新
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              {total}件中 {(page - 1) * 20 + 1} - {Math.min(page * 20, total)}件
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>注文詳細</DialogTitle>
            <DialogDescription>
              #{selectedOrder?.orderNumber.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">顧客名</Label>
                  <p className="font-medium">{selectedOrder.user?.name || "ゲスト"}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">メールアドレス</Label>
                  <p className="font-medium">{selectedOrder.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">注文日</Label>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">追跡番号</Label>
                  <p className="font-medium">{selectedOrder.trackingNumber || "未設定"}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-500 mb-2 block">商品</Label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.product.images[0] && (
                        <Image
                          src={item.product.images[0].url}
                          alt=""
                          width={50}
                          height={50}
                          className="rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-500">
                          ¥{Number(item.price).toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        ¥{Number(item.total).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">合計</span>
                <span className="text-xl font-bold">
                  ¥{Number(selectedOrder.total).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>注文ステータスを更新</DialogTitle>
            <DialogDescription>
              #{selectedOrder?.orderNumber.slice(-8)} のステータスを変更します
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>注文状態</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">保留中</SelectItem>
                  <SelectItem value="PROCESSING">処理中</SelectItem>
                  <SelectItem value="SHIPPED">発送済み</SelectItem>
                  <SelectItem value="DELIVERED">配達完了</SelectItem>
                  <SelectItem value="CANCELLED">キャンセル</SelectItem>
                  <SelectItem value="REFUNDED">返金済み</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>支払状態</Label>
              <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">未払い</SelectItem>
                  <SelectItem value="PROCESSING">処理中</SelectItem>
                  <SelectItem value="COMPLETED">支払済み</SelectItem>
                  <SelectItem value="FAILED">失敗</SelectItem>
                  <SelectItem value="CANCELLED">キャンセル</SelectItem>
                  <SelectItem value="REFUNDED">返金済み</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>追跡番号</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="追跡番号を入力"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleUpdateOrder}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
