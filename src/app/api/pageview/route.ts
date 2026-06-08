import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"
import geoip from "geoip-lite"
import { normalizeCountryCode } from "@/lib/reports/countries"

function hashIP(ip: string): string {
  return createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "card-shop-default")).digest("hex")
}

// IP アドレスから国コードを判定する (geoip-lite のローカル DB を使用、外部通信なし)。
// CDN の geo ヘッダーが無い環境向けのフォールバック。プライベート IP / 不正 IP は null。
function lookupCountryByIp(ip: string): string | null {
  if (!ip || ip === "unknown") return null
  try {
    const geo = geoip.lookup(ip)
    return normalizeCountryCode(geo?.country)
  } catch {
    return null
  }
}

// CDN/プロキシが付与する geo ヘッダーから訪問者の国コードを取得する。
// 優先順: Cloudflare → Vercel → 汎用プロキシ。いずれも無ければ null (国別レポートでは「不明」)。
// 取得には CDN 側の geo 機能 (Cloudflare なら cf-ipcountry、無料) が有効である必要がある。
function detectCountry(request: NextRequest): string | null {
  const candidates = [
    request.headers.get("cf-ipcountry"), // Cloudflare
    request.headers.get("x-vercel-ip-country"), // Vercel
    request.headers.get("x-geo-country"), // 汎用
    request.headers.get("x-country-code"), // 汎用
  ]
  for (const c of candidates) {
    const code = normalizeCountryCode(c)
    if (code) return code
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, productId } = body

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "path is required" }, { status: 400 })
    }

    // Get IP from headers
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
    const ipHash = hashIP(ip)

    const userAgent = request.headers.get("user-agent") || undefined

    const site = (process.env.NEXT_PUBLIC_REGION || "US").toLowerCase()
    // CDN の geo ヘッダーを優先 (将来 Cloudflare 等を入れた場合)、無ければ IP から判定。
    const country = detectCountry(request) ?? lookupCountryByIp(ip)

    await prisma.pageView.create({
      data: {
        path,
        productId: productId || null,
        userAgent,
        ipHash,
        site,
        country,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PageView tracking error:", error)
    return NextResponse.json({ ok: true }) // Don't expose errors, silently fail
  }
}
