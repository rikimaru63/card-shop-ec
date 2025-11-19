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
    title: "Total Revenue",
    value: "$45,231.89",
    change: "+20.1% from last month",
    icon: DollarSign,
    trend: "up"
  },
  {
    title: "Orders",
    value: "2,350",
    change: "+180.1% from last month",
    icon: ShoppingCart,
    trend: "up"
  },
  {
    title: "Products",
    value: "12,234",
    change: "+19% from last month",
    icon: Package,
    trend: "up"
  },
  {
    title: "Active Users",
    value: "573",
    change: "+201 since last hour",
    icon: Users,
    trend: "up"
  }
]

const recentOrders = [
  {
    id: "ORD-001",
    customer: "John Doe",
    product: "Charizard VMAX",
    amount: "$189.99",
    status: "completed"
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    product: "Blue-Eyes White Dragon",
    amount: "$499.99",
    status: "processing"
  },
  {
    id: "ORD-003",
    customer: "Bob Johnson",
    product: "Black Lotus",
    amount: "$49,999.99",
    status: "pending"
  },
  {
    id: "ORD-004",
    customer: "Alice Williams",
    product: "Pikachu VMAX",
    amount: "$79.99",
    status: "completed"
  },
  {
    id: "ORD-005",
    customer: "Charlie Brown",
    product: "Dark Magician",
    amount: "$34.99",
    status: "shipped"
  }
]

const lowStockProducts = [
  { name: "Charizard VMAX", stock: 2, category: "Pokemon" },
  { name: "Blue-Eyes White Dragon", stock: 1, category: "Yu-Gi-Oh!" },
  { name: "Black Lotus", stock: 1, category: "MTG" },
  { name: "The One Ring", stock: 1, category: "MTG" }
]

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline">
                  View Store
                </Button>
              </Link>
              <Button>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
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
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm">
                    View All
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
                        {order.status}
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
                <h2 className="text-lg font-semibold">Low Stock Alert</h2>
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
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full mt-4">
                  Manage Inventory
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
              Add Product
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button className="w-full" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Orders
            </Button>
          </Link>
          <Link href="/admin/customers">
            <Button className="w-full" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Customers
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}