"use client"

import { Shield } from "lucide-react"

export function CustomsNotice() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 text-sm">
            関税手数料について
          </p>
          <p className="text-sm text-blue-800 mt-1">
            国際配送にかかる関税手数料（商品価格の20%）は弊社が負担いたします。
            お客様のご負担はございませんので、ご安心ください。
          </p>
        </div>
      </div>
    </div>
  )
}
