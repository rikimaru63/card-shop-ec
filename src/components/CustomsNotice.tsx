"use client"

import { Shield } from "lucide-react"

export function CustomsNotice() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 text-sm">
            About Customs &amp; Import Fees
          </p>
          <p className="text-sm text-blue-800 mt-1">
            Customs and import fees (20% of product price) for international shipping are covered by us.
            You won&apos;t be charged any additional customs fees.
          </p>
        </div>
      </div>
    </div>
  )
}
