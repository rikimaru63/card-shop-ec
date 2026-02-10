import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"

function hashIP(ip: string): string {
  return createHash("sha256").update(ip + (process.env.IP_HASH_SALT || "samurai-card-hub")).digest("hex")
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

    await prisma.pageView.create({
      data: {
        path,
        productId: productId || null,
        userAgent,
        ipHash,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("PageView tracking error:", error)
    return NextResponse.json({ ok: true }) // Don't expose errors, silently fail
  }
}
