import Link from "next/link"
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield
} from "lucide-react"
import { siteConfig, getCopyright, getActiveSocialLinks } from "@/lib/config/site"

// 実在するページのみをリンクする。Support/Company/Legal の各リンク先(/contact /about
// /privacy 等)は未実装で全て 404 のため、ページが用意できるまでフッターから除外する。
const footerLinks = {
  shop: [
    { name: "All Products", href: "/products" },
    { name: "New Arrivals", href: "/products?sort=newest" },
    { name: "Graded Cards", href: "/products?graded=true" },
    { name: "Featured Cards", href: "/products?featured=true" }
  ]
}

const socialIconMap: Record<string, typeof Facebook> = {
  instagram: Instagram,
  twitter: Twitter,
  facebook: Facebook,
  youtube: Youtube,
}

export function Footer() {
  const activeSocialLinks = getActiveSocialLinks()
  return (
    <footer className="bg-secondary/50 border-t">
      {/* 特徴バー */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">100% Authentic Cards</h3>
                <p className="text-sm text-muted-foreground">Verified & certified</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">SSL encrypted checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインフッター */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ブランド情報 */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">C</span>
              </div>
              <span className="font-bold text-xl">{siteConfig.name}</span>
            </Link>
            <p className="text-muted-foreground mb-4">
              {siteConfig.description}
            </p>
            
            {/* 連絡先情報 */}
            <div className="space-y-2">
              {siteConfig.contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-primary">
                    {siteConfig.contact.email}
                  </a>
                </div>
              )}
              {siteConfig.contact.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${siteConfig.contact.phone.replace(/[\s()-]/g, '')}`} className="hover:text-primary">
                    {siteConfig.contact.phone}
                  </a>
                </div>
              )}
              {siteConfig.contact.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{siteConfig.contact.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* リンクセクション */}
          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ボトムセクション */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* 著作権 */}
            <p className="text-sm text-muted-foreground">
              {getCopyright()}
            </p>

            {/* ソーシャルリンク */}
            {activeSocialLinks.length > 0 && (
              <div className="flex items-center gap-4">
                {activeSocialLinks.map((social) => {
                  const Icon = socialIconMap[social.key]
                  if (!Icon) return null
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      className="p-2 bg-secondary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                      aria-label={social.name}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  )
                })}
              </div>
            )}

            {/* 決済方法 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">We accept:</span>
              {siteConfig.paymentMethods.map((method) => (
                <span key={method} className="text-xs font-semibold px-2 py-1 bg-secondary rounded">{method}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}