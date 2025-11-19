"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  ChevronDown,
  User,
  Heart,
  Globe
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/store/cart-store"
import { useWishlistStore } from "@/store/wishlist-store"

const categories = [
  {
    name: "Pokemon Cards",
    href: "/products",
    subcategories: [
      { name: "Booster Packs", href: "/products?type=booster" },
      { name: "Single Cards", href: "/products?type=singles" },
      { name: "Graded Cards", href: "/products?graded=true" },
      { name: "Promo Cards", href: "/products?type=promo" },
    ]
  }
]

export function Header() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [locale, setLocale] = useState("en")
  const [showLangMenu, setShowLangMenu] = useState(false)
  const cartItems = useCartStore((state) => {
    const total = state.getTotalItems()
    console.log('🔢 Header: Cart total items:', total)
    return total
  })
  const wishlistItems = useWishlistStore((state) => state.getTotalItems())

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

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b">
      {/* 上部バー - プロモーションメッセージ */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
        <p>Free Shipping on Orders Over $100 | Worldwide Delivery</p>
      </div>

      {/* メインヘッダー */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl hidden sm:block">CardShop</span>
          </Link>

          {/* デスクトップナビゲーション */}
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
                
                {/* ドロップダウンメニュー */}
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

          {/* 検索バー */}
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

          {/* 右側のアクション */}
          <div className="flex items-center space-x-2">
            {/* 言語切り替え */}
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
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 ${
                        locale === lang.code ? "bg-secondary font-medium" : ""
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* モバイル検索トグル */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* ウィッシュリスト */}
            <Link href="/wishlist">
              <Button variant="ghost" size="icon" className="relative">
                <Heart className="h-5 w-5" />
                {wishlistItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* アカウント */}
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>

            {/* カート */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {cartItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* モバイルメニュー */}
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

        {/* モバイル検索バー */}
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

      {/* モバイルメニュー */}
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
          </nav>
        </div>
      )}
    </header>
  )
}