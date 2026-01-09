"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  User,
  Heart,
  Globe,
  LogOut,
  Settings,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"

const categories = [
  {
    name: "Pokemon Cards",
    href: "/?game=pokemon",
    subcategories: [
      { name: "Single Cards", href: "/?game=pokemon&productType=SINGLE" },
      { name: "Booster Box & Packs", href: "/?game=pokemon&productType=BOX" },
      { name: "PSA Graded", href: "/?game=pokemon&condition=PSA" },
      { name: "All Pokemon", href: "/?game=pokemon" },
    ]
  },
  {
    name: "One Piece Cards",
    href: "/?game=onepiece",
    subcategories: [
      { name: "Single Cards", href: "/?game=onepiece&productType=SINGLE" },
      { name: "Booster Box & Packs", href: "/?game=onepiece&productType=BOX" },
      { name: "PSA Graded", href: "/?game=onepiece&condition=PSA" },
      { name: "All One Piece", href: "/?game=onepiece" },
    ]
  },
  {
    name: "Other",
    href: "/?game=other",
    subcategories: [
      { name: "Single Cards", href: "/?game=other&productType=SINGLE" },
      { name: "Box & Packs", href: "/?game=other&productType=BOX" },
      { name: "All Other", href: "/?game=other" },
    ]
  }
]

export function Header() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [locale, setLocale] = useState("en")
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const cartItems = useCartStore((state) => state.getTotalItems())
  const wishlistItems = useWishlistStore((state) => state.getTotalItems())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "ja", name: "日本語", flag: "🇯🇵" },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery("")
    }
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center group">
            <img
              src="/logo.jpg"
              alt="SAMURAI CARD HUB"
              className="h-12 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((category) => (
              <div
                key={category.name}
                className="relative"
                onMouseEnter={() => setActiveCategory(category.name)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <Link
                  href={category.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1"
                >
                  {category.name}
                  <ChevronDown className="h-3 w-3" />
                </Link>

                {activeCategory === category.name && (
                  <div className="absolute top-full left-0 w-56 bg-white rounded-lg shadow-lg border mt-1 py-2">
                    {category.subcategories.map((sub) => (
                      <Link
                        key={sub.name}
                        href={sub.href}
                        className="block px-4 py-2 text-sm text-foreground/80 hover:bg-secondary hover:text-primary transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search cards, sets, or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </form>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLangMenu(!showLangMenu)}
                onBlur={() => setTimeout(() => setShowLangMenu(false), 200)}
              >
                <Globe className="h-5 w-5" />
              </Button>
              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLocale(lang.code)
                        setShowLangMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 ${locale === lang.code ? "bg-secondary font-medium" : ""}`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {mounted && wishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistItems}
                  </span>
                )}
              </Button>
            </Link>

            {mounted && (
              <>
                {status === "loading" ? (
                  <Button variant="ghost" size="icon" disabled>
                    <User className="h-5 w-5 animate-pulse" />
                  </Button>
                ) : session ? (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
                      className="relative"
                    >
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          className="h-7 w-7 rounded-full"
                        />
                      ) : (
                        <div className="h-7 w-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {session.user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      )}
                    </Button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-medium truncate">
                            {session.user?.name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {session.user?.email}
                          </p>
                        </div>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <User className="h-4 w-4" />
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <Package className="h-4 w-4" />
                          Order History
                        </Link>
                        <Link
                          href="/account/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <div className="border-t my-1" />
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/auth/signin">
                      <Button variant="ghost" size="sm" className="hidden sm:flex">
                        Sign In
                      </Button>
                      <Button variant="ghost" size="icon" className="sm:hidden">
                        <User className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/auth/signup" className="hidden sm:block">
                      <Button size="sm">Sign Up</Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {mounted && cartItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {cartItems}
                  </span>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="md:hidden py-3 border-t">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </form>
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4">
            {categories.map((category) => (
              <div key={category.name} className="py-2">
                <Link
                  href={category.href}
                  className="font-medium text-foreground/80 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              </div>
            ))}
            {mounted && !session && (
              <div className="pt-4 border-t mt-4 space-y-2">
                <Link
                  href="/auth/signin"
                  className="block py-2 text-foreground/80 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block py-2 text-primary font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Account
                </Link>
              </div>
            )}
            {mounted && session && (
              <div className="pt-4 border-t mt-4 space-y-2">
                <Link
                  href="/account"
                  className="block py-2 text-foreground/80 hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Account
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleSignOut()
                  }}
                  className="block py-2 text-red-600"
                >
                  Sign Out
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
