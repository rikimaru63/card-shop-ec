import type { Metadata } from "next"
import { siteConfig, getActiveSocialLinks } from "@/lib/config/site"

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
  image = siteConfig.seo.ogImage,
  url = "",
  type = "website"
}: SEOProps): Metadata {
  const siteName = siteConfig.name
  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const baseUrl = siteConfig.url
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
    authors: [{ name: siteConfig.name }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
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
      locale: siteConfig.seo.locale,
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
      creator: siteConfig.social.twitterHandle,
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
  const baseUrl = siteConfig.url
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: siteConfig.description,
    sameAs: getActiveSocialLinks().map(l => l.url),
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