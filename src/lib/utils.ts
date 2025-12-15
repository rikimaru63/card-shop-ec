import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(
  price: number | string,
  options: {
    currency?: "USD" | "EUR" | "GBP" | "JPY"
    notation?: Intl.NumberFormatOptions["notation"]
  } = {}
) {
  const { currency = "JPY", notation = "standard" } = options

  const numericPrice = typeof price === "string" ? parseFloat(price) : price

  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    notation,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(numericPrice)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}