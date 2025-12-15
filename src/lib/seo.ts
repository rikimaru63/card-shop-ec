import { Metadata } from "next"

interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: "website" | "article"
}

export function generateSEO({
  title,
  description,
  keywords = [],
  image = "/og-image.jpg",
  url = "",
  type = "website"
}: SEOProps): Metadata {
  const siteName = "CardShop - Premium Trading Cards"
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://card-shop.vercel.app"
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const fullImage = image.startsWith("http") ? image : `${baseUrl}${image}`

  const defaultKeywords = [
    "trading cards",
    "pokemon cards",
    "yugioh cards",
    "magic the gathering",
    "mtg",
    "tcg",
    "card shop",
    "buy trading cards",
    "sell trading cards",
    "collectible cards",
    "card game",
    "one piece cards",
    "sports cards"
  ]

  const keywordSet = new Set([...defaultKeywords, ...keywords])
  const allKeywords = Array.from(keywordSet)

  return {
    title: fullTitle,
    description,
    keywords: allKeywords.join(", "),
    authors: [{ name: "CardShop" }],
    creator: "CardShop",
    publisher: "CardShop",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type,
      locale: "en_US",
      url: fullUrl,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [fullImage],
      creator: "@cardshop",
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

// Product Schema.org structured data
export function generateProductSchema(product: {
  name: string
  description: string
  image: string
  price: number
  category: string
  availability: "InStock" | "OutOfStock"
  rating?: number
  reviewCount?: number
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    category: product.category,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "JPY",
      availability: `https://schema.org/${product.availability}`,
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 0,
      },
    }),
  }
}

// Organization Schema.org structured data
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CardShop",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://card-shop.vercel.app",
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://card-shop.vercel.app"}/logo.png`,
    description: "Your premier destination for trading cards in the USA",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-234-567-890",
      contactType: "Customer Service",
      email: "support@cardshop.com",
      availableLanguage: ["English"],
    },
    sameAs: [
      "https://facebook.com/cardshop",
      "https://twitter.com/cardshop",
      "https://instagram.com/cardshop",
    ],
  }
}

// Breadcrumb Schema.org structured data
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}