"use client"

import { useState, useEffect, useRef } from "react"
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
  CreditCard,
  MapPin,
  Trash2
} from "lucide-react"
import { Label } from "@/components/ui/label"

export const dynamic = 'force-dynamic'

interface ShippingAddress {
  firstName?: string
  lastName?: string
  contactName?: string
  companyName?: string
  company?: string
  street1?: string
  street2?: string
  street3?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  phone?: string
  email?: string
  isResidential?: boolean
}

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
  shippingAddress: ShippingAddress | null
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
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded"
}

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Unpaid",
  PROCESSING: "Processing",
  COMPLETED: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded"
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

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]
const PAYMENT_STATUSES = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"]

// Inline status badge with dropdown
function InlineStatusSelect({
  value,
  options,
  labels,
  colors,
  icons,
  onUpdate,
}: {
  value: string
  options: string[]
  labels: Record<string, string>
  colors: Record<string, string>
  icons?: Record<string, React.ReactNode>
  onUpdate: (newValue: string) => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  const handleSelect = async (newValue: string) => {
    if (newValue === value) {
      setIsOpen(false)
      return
    }
    setIsUpdating(true)
    try {
      await onUpdate(newValue)
    } finally {
      setIsUpdating(false)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="cursor-pointer"
      >
        <Badge className={`${colors[value]} ${isUpdating ? 'opacity-50' : 'hover:opacity-80'} transition-opacity`}>
          {icons && <span className="mr-1">{icons[value]}</span>}
          {labels[value] || value}
        </Badge>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[150px]">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                option === value ? 'bg-gray-50 font-medium' : ''
              }`}
            >
              <Badge className={`${colors[option]} text-xs`}>
                {icons && <span className="mr-1">{icons[option]}</span>}
                {labels[option]}
              </Badge>
              {option === value && <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Format shipping address for display
function formatAddress(addr: ShippingAddress | null): string {
  if (!addr) return "—"
  const name = addr.contactName || [addr.firstName, addr.lastName].filter(Boolean).join(" ")
  const lines = [
    name,
    addr.companyName || addr.company,
    addr.street1,
    [addr.street2, addr.street3].filter(Boolean).join(", "),
    [addr.city, addr.state, addr.postalCode].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean)
  return lines.join(", ")
}

function formatAddressMultiline(addr: ShippingAddress | null): React.ReactNode {
  if (!addr) return <span className="text-gray-400">No address</span>
  const name = addr.contactName || [addr.firstName, addr.lastName].filter(Boolean).join(" ")
  return (
    <div className="text-sm space-y-0.5">
      {name && <p className="font-medium">{name}</p>}
      {(addr.companyName || addr.company) && (
        <p className="text-gray-600">{addr.companyName || addr.company}</p>
      )}
      {addr.street1 && <p>{addr.street1}</p>}
      {addr.street2 && <p>{addr.street2}</p>}
      {addr.street3 && <p>{addr.street3}</p>}
      <p>
        {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
      </p>
      {addr.country && <p>{addr.country}</p>}
      {addr.phone && <p className="text-gray-500">📞 {addr.phone}</p>}
      {addr.isResidential !== undefined && (
        <p className="text-xs text-gray-400">
          {addr.isResidential ? "Residential" : "Commercial"}
        </p>
      )}
    </div>
  )
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [deleting, setDeleting] = useState(false)

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
        title: "Error",
        description: "Failed to fetch orders",
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

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderToDelete.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast({ title: "Deleted", description: `Order #${orderToDelete.orderNumber.slice(-8)} deleted.` })
        setDeleteDialogOpen(false)
        setOrderToDelete(null)
        fetchOrders()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete order", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  // Inline status update
  const updateOrderStatus = async (orderId: string, field: 'status' | 'paymentStatus', newValue: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      })

      if (response.ok) {
        // Update local state
        setOrders(prev => prev.map(o =>
          o.id === orderId ? { ...o, [field]: newValue } : o
        ))
        // Also update selected order if open
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, [field]: newValue } : null)
        }
        toast({
          title: "Updated",
          description: `Order ${field === 'status' ? 'status' : 'payment status'} updated.`,
        })
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive"
      })
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        <h1 className="text-3xl font-bold">Order Management</h1>
        <span className="text-gray-500">{total} orders</span>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by order number or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Order Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={(value) => { setPaymentFilter(value); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Payment Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="PENDING">Unpaid</SelectItem>
            <SelectItem value="COMPLETED">Paid</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Shipping Address</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No orders found
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
                      <p className="font-medium">{order.user?.name || "Guest"}</p>
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
                          <p className="text-xs text-gray-500">+{order.items.length - 1} more</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ¥{Number(order.total).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <InlineStatusSelect
                      value={order.status}
                      options={ORDER_STATUSES}
                      labels={orderStatusLabels}
                      colors={orderStatusColors}
                      icons={orderStatusIcons}
                      onUpdate={(newVal) => updateOrderStatus(order.id, 'status', newVal)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineStatusSelect
                      value={order.paymentStatus}
                      options={PAYMENT_STATUSES}
                      labels={paymentStatusLabels}
                      colors={paymentStatusColors}
                      onUpdate={(newVal) => updateOrderStatus(order.id, 'paymentStatus', newVal)}
                    />
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-xs text-gray-600 truncate" title={formatAddress(order.shippingAddress)}>
                      {order.shippingAddress ? (
                        <>
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {formatAddress(order.shippingAddress)}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(order)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
              Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order #{orderToDelete?.orderNumber.slice(-8)}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              #{selectedOrder?.orderNumber.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Customer</Label>
                  <p className="font-medium">{selectedOrder.user?.name || "Guest"}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Email</Label>
                  <p className="font-medium">{selectedOrder.email}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Order Date</Label>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Tracking Number</Label>
                  <p className="font-medium">{selectedOrder.trackingNumber || "Not set"}</p>
                </div>
              </div>

              {/* Status Inline Edit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500 mb-1 block">Order Status</Label>
                  <InlineStatusSelect
                    value={selectedOrder.status}
                    options={ORDER_STATUSES}
                    labels={orderStatusLabels}
                    colors={orderStatusColors}
                    icons={orderStatusIcons}
                    onUpdate={(newVal) => updateOrderStatus(selectedOrder.id, 'status', newVal)}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-500 mb-1 block">Payment Status</Label>
                  <InlineStatusSelect
                    value={selectedOrder.paymentStatus}
                    options={PAYMENT_STATUSES}
                    labels={paymentStatusLabels}
                    colors={paymentStatusColors}
                    onUpdate={(newVal) => updateOrderStatus(selectedOrder.id, 'paymentStatus', newVal)}
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Shipping Address
                </Label>
                <div className="bg-gray-50 rounded-lg p-4">
                  {formatAddressMultiline(selectedOrder.shippingAddress)}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">Items</Label>
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
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold">
                  ¥{Number(selectedOrder.total).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
