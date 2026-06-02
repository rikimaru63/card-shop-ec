"use client"

import { Check, Clock, CreditCard, Package, Truck, Home, XCircle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED"
type PaymentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED"

interface OrderStatusStepperProps {
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  className?: string
}

type StepState = "done" | "current" | "upcoming"

interface Step {
  key: string
  label: string
  icon: typeof Check
  state: StepState
}

// orderStatus と paymentStatus を 6 段階のステップに正規化する。
// CANCELLED / REFUNDED は別レイアウトで表示するため、ここでは扱わない。
function computeSteps(orderStatus: OrderStatus, paymentStatus: PaymentStatus): Step[] {
  // 進行度を 0〜5 で表現
  // 0: 注文受付 / 1: お支払い待ち / 2: お支払い確認中 / 3: 発送準備 / 4: 発送済 / 5: お届け済
  let progress = 0
  if (orderStatus === "DELIVERED") progress = 5
  else if (orderStatus === "SHIPPED") progress = 4
  else if (paymentStatus === "COMPLETED") progress = 3
  else if (paymentStatus === "PROCESSING") progress = 2
  else if (paymentStatus === "PENDING") progress = 1
  else progress = 0

  const labels: { key: string; label: string; icon: typeof Check }[] = [
    { key: "placed", label: "注文受付", icon: Check },
    { key: "awaiting", label: "お支払い待ち", icon: Clock },
    { key: "verifying", label: "お支払い確認中", icon: CreditCard },
    { key: "preparing", label: "発送準備", icon: Package },
    { key: "shipped", label: "発送済", icon: Truck },
    { key: "delivered", label: "お届け済", icon: Home },
  ]

  return labels.map((l, i) => {
    let state: StepState = "upcoming"
    if (i < progress) state = "done"
    else if (i === progress) state = "current"
    return { ...l, state }
  })
}

export function OrderStatusStepper({ orderStatus, paymentStatus, className }: OrderStatusStepperProps) {
  // キャンセル / 返金 の場合は専用バナー
  if (orderStatus === "CANCELLED" || paymentStatus === "CANCELLED") {
    return (
      <div className={cn("rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3", className)}>
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-800">この注文はキャンセル済みです</p>
          <p className="text-sm text-red-600">在庫は他のお客様にご案内できる状態に戻っております</p>
        </div>
      </div>
    )
  }
  if (orderStatus === "REFUNDED" || paymentStatus === "REFUNDED") {
    return (
      <div className={cn("rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3", className)}>
        <RotateCcw className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-800">返金処理が完了しています</p>
          <p className="text-sm text-amber-700">ご利用の決済サービスで返金内容をご確認ください</p>
        </div>
      </div>
    )
  }

  const steps = computeSteps(orderStatus, paymentStatus)

  return (
    <div className={cn("rounded-lg border bg-white px-3 py-4 sm:px-4 sm:py-5", className)}>
      <ol className="flex items-start justify-between gap-1 sm:gap-2">
        {steps.map((step, i) => {
          const Icon = step.icon
          const isLast = i === steps.length - 1
          const circleBase = "relative flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors"
          const circleClass =
            step.state === "done"
              ? "border-green-600 bg-green-600 text-white"
              : step.state === "current"
              ? "border-green-600 bg-white text-green-600 ring-4 ring-green-100"
              : "border-gray-300 bg-white text-gray-400"
          const labelClass =
            step.state === "done"
              ? "text-green-700"
              : step.state === "current"
              ? "text-green-700 font-semibold"
              : "text-gray-400"
          const connectorClass =
            step.state === "done" ? "bg-green-600" : "bg-gray-200"

          return (
            <li key={step.key} className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="relative w-full flex items-center justify-center">
                {/* 左側コネクタ (最初の要素以外) */}
                {i > 0 && (
                  <div className={cn("absolute left-0 right-1/2 top-1/2 -translate-y-1/2 h-0.5", connectorClass)} />
                )}
                {/* 右側コネクタ (最後の要素以外) */}
                {!isLast && (
                  <div className={cn(
                    "absolute right-0 left-1/2 top-1/2 -translate-y-1/2 h-0.5",
                    steps[i + 1].state !== "upcoming" ? "bg-green-600" : "bg-gray-200"
                  )} />
                )}
                <div className={cn(circleBase, circleClass)}>
                  {step.state === "done" ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={3} />
                  ) : (
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
              </div>
              <span className={cn("mt-2 text-[10px] sm:text-xs leading-tight", labelClass)}>
                {step.label}
              </span>
              {step.state === "current" && (
                <span className="mt-1 text-[10px] sm:text-xs text-green-700 font-semibold">今ここ</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
