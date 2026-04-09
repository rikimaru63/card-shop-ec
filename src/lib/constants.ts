/** リージョン判定（US版は関税あり、EU版は関税なし） */
const REGION = process.env.NEXT_PUBLIC_REGION || "US"

/** 関税率（US: 13%, EU: 0%） */
export const CUSTOMS_RATE = REGION === "EU" ? 0 : 0.13

/** 関税込み乗数（1 + CUSTOMS_RATE） */
export const DUTY_MULTIPLIER = 1 + CUSTOMS_RATE
