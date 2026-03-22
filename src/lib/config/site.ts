// src/lib/config/site.ts

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Card Shop",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Your premier destination for trading cards",
  url: process.env.NEXT_PUBLIC_BASE_URL || "https://example.com",

  contact: {
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
    phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
    address: process.env.NEXT_PUBLIC_ADDRESS || "",
  },

  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || "",
    twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "",
  },

  seo: {
    keywords: process.env.NEXT_PUBLIC_SEO_KEYWORDS || "trading cards, pokemon cards, tcg",
    ogImage: "/og-image.jpg",
    locale: "en_US",
  },

  tracking: {
    gaId: process.env.NEXT_PUBLIC_GA_ID || "",
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  },

  paymentMethods: ["Wise"],

  logo: {
    src: "/logo.jpg",
    alt: process.env.NEXT_PUBLIC_SITE_NAME || "Card Shop",
  },

  categories: [
    {
      name: "Pokemon Cards",
      href: "/?game=pokemon",
      subcategories: [
        { name: "Single Cards", href: "/?game=pokemon&productType=SINGLE" },
        { name: "Booster Box & Packs", href: "/?game=pokemon&productType=BOX" },
        { name: "PSA Graded", href: "/?game=pokemon&condition=PSA" },
        { name: "All Pokemon", href: "/?game=pokemon" },
      ],
    },
    {
      name: "One Piece Cards",
      href: "/?game=onepiece",
      subcategories: [
        { name: "Single Cards", href: "/?game=onepiece&productType=SINGLE" },
        { name: "Booster Box & Packs", href: "/?game=onepiece&productType=BOX" },
        { name: "PSA Graded", href: "/?game=onepiece&condition=PSA" },
        { name: "All One Piece", href: "/?game=onepiece" },
      ],
    },
    {
      name: "Other",
      href: "/?game=other",
      subcategories: [
        { name: "Single Cards", href: "/?game=other&productType=SINGLE" },
        { name: "Box & Packs", href: "/?game=other&productType=BOX" },
        { name: "All Other", href: "/?game=other" },
      ],
    },
  ],

  dbCategories: [
    { name: "Pokemon Cards", slug: "pokemon-cards", description: "Pokemon TCG singles, boxes, and packs" },
    { name: "One Piece Cards", slug: "onepiece-cards", description: "One Piece TCG singles, boxes, and packs" },
  ],
}

export function getCopyright(): string {
  return `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`
}

export function getActiveSocialLinks() {
  const { social } = siteConfig
  const links = [
    { name: "Instagram", key: "instagram" as const, url: social.instagram },
    { name: "Twitter", key: "twitter" as const, url: social.twitter },
    { name: "Facebook", key: "facebook" as const, url: social.facebook },
    { name: "YouTube", key: "youtube" as const, url: social.youtube },
  ]
  return links.filter((l) => l.url)
}
