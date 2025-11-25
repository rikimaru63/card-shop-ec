"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import {
  Package,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Mail,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/account")
    }
  }, [status, router])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const menuItems = [
    {
      icon: Package,
      label: "Order History",
      description: "View your past orders and track shipments",
      href: "/account/orders"
    },
    {
      icon: MapPin,
      label: "Addresses",
      description: "Manage your shipping and billing addresses",
      href: "/account/addresses"
    },
    {
      icon: Heart,
      label: "Wishlist",
      description: "View your saved items",
      href: "/wishlist"
    },
    {
      icon: Settings,
      label: "Account Settings",
      description: "Update your profile and preferences",
      href: "/account/settings"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col items-center text-center">
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-24 w-24 rounded-full mb-4"
                  />
                ) : (
                  <div className="h-24 w-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <h2 className="text-xl font-semibold">
                  {session.user?.name || "User"}
                </h2>
                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
                  <Mail className="h-4 w-4" />
                  {session.user?.email}
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs bg-secondary px-3 py-1 rounded-full">
                  <Shield className="h-3 w-3" />
                  <span>Customer</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border divide-y">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Wishlist</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
