import Link from "next/link"
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Mock data
const stats = [
  {
    title: "総売上",
    value: "$45,231.89",
    change: "先月比 +20.1%",
    icon: DollarSign,
    trend: "up"
  },
  {
    title: "注文数",
    value: "2,350",
    change: "先月比 +180.1%",
    icon: ShoppingCart,
    trend: "up"
  },
  {
    title: "商品数",
    value: "12,234",
    change: "先月比 +19%",
    icon: Package,
    trend: "up"
  },
  {
    title: "アクティブユーザー",
    value: "573",
    change: "1時間前から +201",
    icon: Users,
    trend: "up"
  }
]

const recentOrders = [
  {
    id: "ORD-001",
    customer: "田中 太郎",
    product: "リザードン VMAX",
    amount: "$189.99",
    status: "completed",
    statusLabel: "完了"
  },
  {
    id: "ORD-002",
    customer: "鈴木 花子",
    product: "ピカチュウ VMAX",
    amount: "$499.99",
    status: "processing",
    statusLabel: "処理中"
  },
  {
    id: "ORD-003",
    customer: "佐藤 一郎",
    product: "ミュウツー SAR",
    amount: "$49,999.99",
    status: "pending",
    statusLabel: "保留中"
  },
  {
    id: "ORD-004",
    customer: "高橋 美咲",
    product: "ピカチュウ ex",
    amount: "$79.99",
    status: "completed",
    statusLabel: "完了"
  },
  {
    id: "ORD-005",
    customer: "山田 健太",
    product: "レックウザ SAR",
    amount: "$34.99",
    status: "shipped",
    statusLabel: "発送済"
  }
]

const lowStockProducts = [
  { name: "リザードン VMAX", stock: 2, category: "ポケモン" },
  { name: "ピカチュウ SAR", stock: 1, category: "ポケモン" },
  { name: "ミュウツー ex", stock: 1, category: "ポケモン" },
  { name: "レックウザ SAR", stock: 1, category: "ポケモン" }
]

export default function AdminDashboard() {
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
                    <TrendingUp className="h-3 w-3 text-green-600" />
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
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-sm text-muted-foreground">{order.product}</p>
                      <p className="text-xs text-muted-foreground">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{order.amount}</p>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : order.status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : order.status === "shipped"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {order.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-4">
                {lowStockProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                        残り{product.stock}点
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full mt-4">
                  在庫管理
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Link href="/admin/customers">
            <Button className="w-full" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              顧客管理
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              分析
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
