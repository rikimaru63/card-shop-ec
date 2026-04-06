// src/lib/config/business.ts

import { CUSTOMS_RATE } from "@/lib/constants"

export const businessConfig = {
  shipping: {
    baseCost: Number(process.env.NEXT_PUBLIC_SHIPPING_COST || 4500),
    freeThreshold: Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD || 50000),
  },

  customs: {
    rate: CUSTOMS_RATE,
  },

  box: {
    minimumQuantity: 5,
  },

  currency: {
    default: "JPY",
    symbol: "¥",
  },

  reservation: {
    expiryMinutes: 30,
  },
}
