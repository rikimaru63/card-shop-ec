import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import '@/styles/globals.css'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { AuthProvider } from '@/components/providers/session-provider'
import { PageViewTracker } from '@/components/page-view-tracker'
import { MetaPixelPageView } from '@/components/MetaPixelPageView'
import Script from 'next/script'
import { siteConfig } from '@/lib/config/site'
import { CartNotifications } from '@/components/cart/cart-notifications'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display', weight: ['400', '600', '700'] })

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: siteConfig.seo.keywords,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const metaPixelId = siteConfig.tracking.metaPixelId

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background antialiased",
        dmSans.variable,
        playfair.variable,
        dmSans.className
      )}>
        {/* Meta Pixel Base Code */}
        {metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        {metaPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        <AuthProvider>
          <MetaPixelPageView />
          <PageViewTracker />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartNotifications />
        </AuthProvider>
      </body>
    </html>
  )
}
