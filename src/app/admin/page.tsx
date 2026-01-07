import Link from "next/link"
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Settings,
  Minus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Status label mapping
const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "保留中", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "確認済", color: "bg-blue-100 text-blue-800" },
  PROCESSING: { label: "処理中", color: "bg-blue-100 text-blue-800" },
  SHIPPED: { label: "発送済", color: "bg-purple-100 text-purple-800" },
  DELIVERED: { label: "配達完了", color: "bg-green-100 text-green-800" },
  COMPLETED: { label: "完了", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "キャンセル", color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "返金済", color: "bg-gray-100 text-gray-800" }
}

export default async function AdminDashboard() {
  // Get current date info for comparison
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  // Fetch all stats in parallel
  const [
    // Current month stats
    currentMonthOrders,
    currentMonthSales,
    // Last month stats
    lastMonthOrders,
    lastMonthSales,
    // Total counts
    totalProducts,
    totalUsers,
    // Recent orders
    recentOrders,
    // Low stock products
    lowStockProducts
  ] = await Promise.all([
    // Current month order count
    prisma.order.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    }),
    // Current month sales
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        status: { notIn: ['CANCELLED', 'REFUNDED'] }
      },
      _sum: { total: true }
    }),
    // Last month order count
    prisma.order.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
      }
    }),
    // Last month sales
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { notIn: ['CANCELLED', 'REFUNDED'] }
      },
      _sum: { total: true }
    }),
    // Total product count
    prisma.product.count({
      where: { published: true }
    }),
    // Total user count
    prisma.user.count(),
    // Recent 5 orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        shippingAddress: true,
        user: {
          select: { name: true, email: true }
        },
        items: {
          take: 1,
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    }),
    // Low stock products (stock <= 3)
    prisma.product.findMany({
      where: {
        published: true,
        stock: { lte: 3 }
      },
      take: 10,
      orderBy: { stock: 'asc' },
      include: {
        category: {
          select: { name: true }
        }
      }
    })
  ])

  // Calculate stats
  const currentSales = currentMonthSales._sum.total?.toNumber() || 0
  const lastSales = lastMonthSales._sum.total?.toNumber() || 0
  const salesChange = lastSales > 0 ? ((currentSales - lastSales) / lastSales * 100).toFixed(1) : 0
  const orderChange = lastMonthOrders > 0 ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1) : 0

  // Format stats for display
  const stats = [
    {
      title: "今月の売上",
      value: `¥${currentSales.toLocaleString()}`,
      change: `先月比 ${Number(salesChange) >= 0 ? '+' : ''}${salesChange}%`,
      icon: DollarSign,
      trend: Number(salesChange) >= 0 ? "up" : "down"
    },
    {
      title: "今月の注文数",
      value: currentMonthOrders.toLocaleString(),
      change: `先月比 ${Number(orderChange) >= 0 ? '+' : ''}${orderChange}%`,
      icon: ShoppingCart,
      trend: Number(orderChange) >= 0 ? "up" : "down"
    },
    {
      title: "公開商品数",
      value: totalProducts.toLocaleString(),
      change: "公開中の商品",
      icon: Package,
      trend: "neutral"
    },
    {
      title: "登録ユーザー数",
      value: totalUsers.toLocaleString(),
      change: "総ユーザー数",
      icon: Users,
      trend: "neutral"
    }
  ]

  // Format recent orders for display
  const formattedOrders = recentOrders.map(order => {
    // Try to get customer name from user or shipping address
    let customerName = 'ゲスト'
    if (order.user?.name) {
      customerName = order.user.name
    } else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
      const addr = order.shippingAddress as { name?: string }
      if (addr.name) customerName = addr.name
    }

    return {
      id: order.orderNumber || order.id.slice(0, 8),
      customer: customerName,
      product: order.items[0]?.product?.name || '商品',
      itemCount: order.items.length,
      amount: `¥${order.total.toNumber().toLocaleString()}`,
      status: order.status,
      statusInfo: statusLabels[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" }
    }
  })

  // Format low stock products for display
  const formattedLowStock = lowStockProducts.map(product => ({
    id: product.id,
    name: product.name,
    stock: product.stock,
    category: product.category?.name || 'カテゴリなし'
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">管理ダッシュボード</h1>
              <p className="text-sm text-muted-foreground">おかえりなさい、管理者様</p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">
                  ストアを表示
                </Button>
              </Link>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                レポート
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.title} className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                    {stat.trend === "down" && <TrendingDown className="h-3 w-3 text-red-600" />}
                    {stat.trend === "neutral" && <Minus className="h-3 w-3 text-gray-400" />}
                    {stat.change}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-lg border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">最近の注文</h2>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">
                    すべて表示
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-6">
              {formattedOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  まだ注文がありません
                </p>
              ) : (
                <div className="space-y-4">
                  {formattedOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.product}
                          {order.itemCount > 1 && ` 他${order.itemCount - 1}点`}
                        </p>
                        <p className="text-xs text-muted-foreground">{order.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{order.amount}</p>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${order.statusInfo.color}`}>
                          {order.statusInfo.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">在庫アラート</h2>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="p-6">
              {formattedLowStock.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  在庫不足の商品はありません
                </p>
              ) : (
                <div className="space-y-4">
                  {formattedLowStock.map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          product.stock === 0
                            ? "bg-red-100 text-red-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {product.stock === 0 ? "在庫切れ" : `残り${product.stock}点`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/admin/products">
                <Button variant="outline" className="w-full mt-4">
                  在庫管理
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link href="/admin/products/new">
            <Button className="w-full" variant="outline">
              <Package className="h-4 w-4 mr-2" />
              商品を追加
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button className="w-full" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              注文を確認
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button className="w-full" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              顧客管理
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              商品一覧
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button className="w-full" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              設定
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
