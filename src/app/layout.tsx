import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AuthProvider } from '@/components/providers/session-provider'
import { PageViewTracker } from '@/components/page-view-tracker'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SAMURAI Card HUB - Premium Trading Cards',
  description: 'Your premier destination for trading cards',
  keywords: 'trading cards, pokemon cards, tcg, card shop, samurai',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <AuthProvider>
          <PageViewTracker />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
