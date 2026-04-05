# Five Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 client-requested improvements: sold-out sort, stock release, filter fix, shipping toast, pikachu promo modal.

**Architecture:** Each improvement is independent. Tasks ordered by dependency: bug fixes first (③), then backend changes (①②), then frontend features (④⑤). Cart store gains a notification callback for ④⑤.

**Tech Stack:** Next.js 14 (App Router), Prisma/PostgreSQL, Zustand, Radix UI Toast, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-05-five-improvements-design.md`

---

## File Structure

### New Files
- `src/app/admin/actions.ts` — Admin server actions (releaseOrderStock)
- `src/app/api/user/promo-eligibility/route.ts` — Pikachu promo eligibility API
- `src/components/ui/free-shipping-toast.tsx` — Free shipping progress toast component
- `src/components/ui/pikachu-promo-modal.tsx` — Pikachu promo celebration modal
- `src/components/cart/cart-notifications.tsx` — Cart notification orchestrator (triggers toast + modal)

### Modified Files
- `src/app/api/products/route.ts` — Search filter fix + sold-out sort
- `src/app/api/admin/products/route.ts` — Search filter fix + sold-out sort + updatedAt sort
- `src/components/admin/AdminProductsClient.tsx` — Remove 500 limit cap
- `src/app/admin/orders/page.tsx` — Add "Release Stock" button
- `src/store/cart-store.ts` — Add notification event on addItem
- `src/app/layout.tsx` — Add CartNotifications component

---

## Task 1: Fix Admin Product Filter Bugs (③)

**Files:**
- Modify: `src/app/api/admin/products/route.ts:44-51` (search OR fix)
- Modify: `src/app/api/admin/products/route.ts:120-148` (add updatedAt sort)
- Modify: `src/components/admin/AdminProductsClient.tsx:69` (limit fix)
- Modify: `src/app/api/products/route.ts:105-112` (public API search OR fix)

- [ ] **Step 1: Fix search filter OR overwrite in admin API**

In `src/app/api/admin/products/route.ts`, replace lines 44-52:

```typescript
// BEFORE (broken):
// Search filter (name, cardNumber, sku)
if (search) {
  where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { nameJa: { contains: search, mode: 'insensitive' } },
    { cardNumber: { contains: search, mode: 'insensitive' } },
    { sku: { contains: search, mode: 'insensitive' } }
  ]
}

// AFTER (fixed):
// Search filter (name, cardNumber, sku) — wrapped in AND to avoid overwriting other OR clauses
if (search) {
  if (!where.AND) where.AND = []
  ;(where.AND as Prisma.ProductWhereInput[]).push({
    OR: [
      { name: { contains: search, mode: 'insensitive' } },
      { nameJa: { contains: search, mode: 'insensitive' } },
      { cardNumber: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ]
  })
}
```

- [ ] **Step 2: Add updatedAt sort case in admin API**

In `src/app/api/admin/products/route.ts`, add after the `stock-desc` case (around line 146):

```typescript
      case 'stock-desc':
        orderBy = [{ stock: 'desc' }]
        break
      case 'updatedAt':
        orderBy = [{ updatedAt: 'desc' }]
        break
      // default 'sortOrder' keeps the manual drag order
```

- [ ] **Step 3: Fix limit cap in AdminProductsClient**

In `src/components/admin/AdminProductsClient.tsx`, change line 69:

```typescript
// BEFORE:
params.set("limit", "500")

// AFTER — use server-side pagination instead of fetching all:
params.set("limit", "50")
params.set("page", "1")
```

Note: This changes the admin product list to use proper pagination when filters are active. The drag-reorder feature (which needs all products) still works via the default `initialProducts` path (no filters active).

- [ ] **Step 4: Fix search filter OR overwrite in public API**

In `src/app/api/products/route.ts`, replace lines 106-112:

```typescript
// BEFORE (broken):
if (search) {
  where.OR = [
    { name: { contains: search, mode: 'insensitive' as const } },
    { nameJa: { contains: search, mode: 'insensitive' as const } },
    { description: { contains: search, mode: 'insensitive' as const } }
  ]
}

// AFTER (fixed):
if (search) {
  if (!where.AND) where.AND = []
  ;(where.AND as Prisma.ProductWhereInput[]).push({
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { nameJa: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } }
    ]
  })
}
```

- [ ] **Step 5: Verify the app builds**

Run: `cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -20`
Expected: Build succeeds without errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/products/route.ts src/app/api/products/route.ts src/components/admin/AdminProductsClient.tsx
git commit -m "fix: 商品フィルターのOR上書きバグ・updatedAtソート未実装・limit上限を修正"
```

---

## Task 2: Sold-Out Products Sort to Back (①)

**Files:**
- Modify: `src/app/api/products/route.ts:140-165` (two-phase query)
- Modify: `src/app/api/admin/products/route.ts:120-164` (two-phase query)

- [ ] **Step 1: Implement two-phase query in public products API**

In `src/app/api/products/route.ts`, replace the query and pagination section (lines 140-165):

```typescript
    // Calculate pagination
    const skip = (page - 1) * limit

    // If inStock filter is active, stock is already filtered — skip two-phase split
    const useStockSort = !where.stock

    if (!useStockSort) {
      // Single query path (inStock filter active)
      const [singleProducts, singleTotal] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { take: 1, orderBy: { order: 'asc' } }
          }
        }),
        prisma.product.count({ where })
      ])
      // Use singleProducts and singleTotal below...
      // (Full integration shown in actual implementation)
    }

    // Two-phase query: in-stock first, then out-of-stock
    // Count each group separately for correct pagination
    const inStockWhere = { ...where, stock: { gt: 0 } }
    const outOfStockWhere = { ...where, stock: { equals: 0 } }

    const [inStockCount, outOfStockCount] = await Promise.all([
      prisma.product.count({ where: inStockWhere }),
      prisma.product.count({ where: outOfStockWhere })
    ])

    const total = inStockCount + outOfStockCount
    let products: any[] = []

    if (skip < inStockCount) {
      // Page overlaps with in-stock group
      const inStockTake = Math.min(limit, inStockCount - skip)
      const inStockProducts = await prisma.product.findMany({
        where: inStockWhere,
        orderBy,
        skip,
        take: inStockTake,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 1, orderBy: { order: 'asc' } }
        }
      })
      products = [...inStockProducts]

      // If page needs more items, fetch from out-of-stock group
      const remaining = limit - inStockTake
      if (remaining > 0) {
        const outOfStockProducts = await prisma.product.findMany({
          where: outOfStockWhere,
          orderBy,
          skip: 0,
          take: remaining,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { take: 1, orderBy: { order: 'asc' } }
          }
        })
        products = [...products, ...outOfStockProducts]
      }
    } else {
      // Page is entirely in the out-of-stock group
      const outOfStockSkip = skip - inStockCount
      const outOfStockProducts = await prisma.product.findMany({
        where: outOfStockWhere,
        orderBy,
        skip: outOfStockSkip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { take: 1, orderBy: { order: 'asc' } }
        }
      })
      products = [...outOfStockProducts]
    }
```

Also update the `where` clause construction: if `inStock === 'true'` filter is already active, skip the two-phase split (all results are already in-stock). Add this check before the two-phase query:

```typescript
    // If inStock filter is active, no need for two-phase split
    const useStockSort = inStock !== 'true'
```

Then wrap the two-phase logic in `if (useStockSort) { ... } else { /* original single query */ }`.

- [ ] **Step 2: Implement two-phase query in admin products API**

Apply the same two-phase query pattern to `src/app/api/admin/products/route.ts` (lines 150-164). The logic is identical but includes `category: true` in the include clause instead of the select pattern.

```typescript
    // Two-phase query: in-stock first, then out-of-stock
    const useStockSort = inStock !== 'true'

    let products: any[]
    let total: number

    if (useStockSort) {
      const inStockWhere: Prisma.ProductWhereInput = { ...where, stock: { gt: 0 } }
      const outOfStockWhere: Prisma.ProductWhereInput = { ...where, stock: { equals: 0 } }

      const [inStockCount, outOfStockCount] = await Promise.all([
        prisma.product.count({ where: inStockWhere }),
        prisma.product.count({ where: outOfStockWhere })
      ])

      total = inStockCount + outOfStockCount
      products = []

      if (skip < inStockCount) {
        const inStockTake = Math.min(limit, inStockCount - skip)
        const inStockProducts = await prisma.product.findMany({
          where: inStockWhere,
          orderBy,
          skip,
          take: inStockTake,
          include: { category: true, images: { take: 1, orderBy: { order: 'asc' } } }
        })
        products = [...inStockProducts]

        const remaining = limit - inStockTake
        if (remaining > 0) {
          const outOfStockProducts = await prisma.product.findMany({
            where: outOfStockWhere,
            orderBy,
            skip: 0,
            take: remaining,
            include: { category: true, images: { take: 1, orderBy: { order: 'asc' } } }
          })
          products = [...products, ...outOfStockProducts]
        }
      } else {
        const outOfStockSkip = skip - inStockCount
        products = await prisma.product.findMany({
          where: outOfStockWhere,
          orderBy,
          skip: outOfStockSkip,
          take: limit,
          include: { category: true, images: { take: 1, orderBy: { order: 'asc' } } }
        })
      }
    } else {
      // inStock filter active — single query
      ;[products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: { category: true, images: { take: 1, orderBy: { order: 'asc' } } }
        }),
        prisma.product.count({ where })
      ])
    }
```

- [ ] **Step 3: Verify stock filter interaction is handled**

Confirm that in both Step 1 and Step 2, the `useStockSort` check correctly detects when `where.stock` is already set (from `inStock === 'true'` filter). The check `const useStockSort = !where.stock` in both files ensures that when InStock filter is active, the single-query path is used (avoiding conflicting stock conditions).

- [ ] **Step 4: Verify the app builds**

Run: `cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -20`
Expected: Build succeeds without errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/products/route.ts src/app/api/admin/products/route.ts
git commit -m "feat: 在庫切れ商品を一覧の最後に表示する（全ページ対応）"
```

---

## Task 3: Stock Release Button in Admin (②)

**Files:**
- Create: `src/app/admin/actions.ts`
- Modify: `src/app/admin/orders/page.tsx`

- [ ] **Step 1: Create admin server action for stock release**

Create `src/app/admin/actions.ts`:

```typescript
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

/**
 * Release (restore) stock for an order.
 * Used when a customer clicked "Payment Complete" without actually paying.
 * Reverses the stock decrement and cancels the order.
 */
export async function releaseOrderStock(orderNumber: string): Promise<{
  success: boolean
  message?: string
  releasedItems?: { name: string; quantity: number }[]
}> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { select: { name: true } } } } }
    })

    if (!order) {
      return { success: false, message: "Order not found" }
    }

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return { success: false, message: "Cannot release stock for shipped/delivered orders" }
    }

    if (order.status === "CANCELLED") {
      return { success: false, message: "This order is already cancelled" }
    }

    const releasedItems: { name: string; quantity: number }[] = []

    await prisma.$transaction(async (tx) => {
      // Find confirmed reservations (stock was decremented)
      const confirmedReservations = await tx.stockReservation.findMany({
        where: { orderNumber, confirmed: true }
      })

      // Restore stock for each confirmed reservation
      for (const reservation of confirmedReservations) {
        await tx.product.update({
          where: { id: reservation.productId },
          data: { stock: { increment: reservation.quantity } }
        })

        // Find product name for the response
        const orderItem = order.items.find(i => i.productId === reservation.productId)
        releasedItems.push({
          name: orderItem?.product?.name || reservation.productId,
          quantity: reservation.quantity
        })
      }

      // Also handle unconfirmed reservations (just delete them)
      await tx.stockReservation.deleteMany({
        where: { orderNumber }
      })

      // Cancel the order
      await tx.order.update({
        where: { orderNumber },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          reservationExpiresAt: null,
          notes: [
            order.notes,
            `Stock released by admin at ${new Date().toISOString()}`
          ].filter(Boolean).join("\n")
        }
      })
    })

    revalidatePath("/admin/orders")
    revalidatePath("/admin/products")
    revalidatePath("/products")

    return {
      success: true,
      message: `Stock released for ${releasedItems.length} item(s)`,
      releasedItems
    }
  } catch (error) {
    console.error("Failed to release order stock:", error)
    return { success: false, message: "Failed to release stock. Please try again." }
  }
}
```

- [ ] **Step 2: Add Release Stock button to admin orders page**

In `src/app/admin/orders/page.tsx`, add the import at the top:

```typescript
import { releaseOrderStock } from "@/app/admin/actions"
import { PackageOpen } from "lucide-react"
```

Add `PackageOpen` to the existing lucide-react import.

- [ ] **Step 3: Add release stock dialog state and handler**

In the `OrdersPage` component (around line 290, after existing state declarations), add:

```typescript
  // Release stock state
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [orderToRelease, setOrderToRelease] = useState<Order | null>(null)
  const [releasing, setReleasing] = useState(false)

  const handleReleaseStock = async () => {
    if (!orderToRelease) return
    setReleasing(true)
    try {
      const result = await releaseOrderStock(orderToRelease.orderNumber)
      if (result.success) {
        toast({
          title: "Stock Released",
          description: result.message,
        })
        fetchOrders()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to release stock",
        variant: "destructive",
      })
    } finally {
      setReleasing(false)
      setReleaseDialogOpen(false)
      setOrderToRelease(null)
    }
  }
```

- [ ] **Step 4: Add Release Stock button to order table row actions**

Find the existing action buttons in the order table (where the Eye/Trash icons are). Add a "Release Stock" button that appears only for orders with paymentStatus "PROCESSING":

```typescript
{order.paymentStatus === "PROCESSING" && order.status !== "CANCELLED" && (
  <Button
    variant="outline"
    size="sm"
    className="h-8 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
    onClick={(e) => {
      e.stopPropagation()
      setOrderToRelease(order)
      setReleaseDialogOpen(true)
    }}
  >
    <PackageOpen className="h-3.5 w-3.5 mr-1" />
    Release Stock
  </Button>
)}
```

- [ ] **Step 5: Add release stock confirmation dialog**

Add the dialog JSX at the end of the component (before the closing fragment), next to the existing delete dialog:

```typescript
      {/* Release Stock Dialog */}
      <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Release Stock</DialogTitle>
            <DialogDescription>
              Are you sure you want to release stock for order{" "}
              <strong>{orderToRelease?.orderNumber}</strong>?
              This will restore all items to inventory and cancel the order.
            </DialogDescription>
          </DialogHeader>
          {orderToRelease && (
            <div className="py-2">
              <p className="text-sm text-gray-600 mb-2">Items to be restored:</p>
              <ul className="text-sm space-y-1">
                {orderToRelease.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>{item.product.name}</span>
                    <span className="text-gray-500">×{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReleaseDialogOpen(false)}
              disabled={releasing}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleReleaseStock}
              disabled={releasing}
            >
              {releasing ? "Releasing..." : "Release Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

- [ ] **Step 6: Verify the app builds**

Run: `cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -20`
Expected: Build succeeds without errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/actions.ts src/app/admin/orders/page.tsx
git commit -m "feat: 管理画面に在庫解放ボタンを追加（注文単位で在庫を復元）"
```

---

## Task 4: Free Shipping Progress Toast (④)

**Files:**
- Create: `src/components/ui/free-shipping-toast.tsx`
- Create: `src/components/cart/cart-notifications.tsx`
- Modify: `src/store/cart-store.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add notification event to cart store**

In `src/store/cart-store.ts`, add a notification callback system. Add these types and the modified addItem:

After the `CartStore` interface (line 46), add a notification event emitter:

```typescript
// Cart notification events
type CartNotificationHandler = (event: {
  type: 'item-added'
  singleBoxTotal: number
  previousSingleBoxTotal: number
  isFreeShipping: boolean
  wasFreeShipping: boolean
  freeThreshold: number
}) => void

const cartNotificationListeners: CartNotificationHandler[] = []

export function onCartNotification(handler: CartNotificationHandler) {
  cartNotificationListeners.push(handler)
  return () => {
    const index = cartNotificationListeners.indexOf(handler)
    if (index > -1) cartNotificationListeners.splice(index, 1)
  }
}
```

Then modify the `addItem` method to emit the event. After the `set()` call inside `addItem`, add:

```typescript
      addItem: (item, quantity = 1) => {
        const qty = Math.max(1, Math.min(quantity, item.stock))

        // Capture previous state for notification
        const prevItems = get().items
        const prevSingleBoxTotal = prevItems
          .filter(i => { const t = getEffectiveType(i); return t === 'SINGLE' || t === 'BOX' })
          .reduce((sum, i) => sum + i.price * i.quantity, 0)
        const wasFreeShipping = prevSingleBoxTotal >= businessConfig.shipping.freeThreshold

        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id)

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
                  : i
              )
            }
          }

          return {
            items: [...state.items, { ...item, quantity: qty, productType: getEffectiveType(item) }]
          }
        })

        // Emit notification after state update
        const newItems = get().items
        const newSingleBoxTotal = newItems
          .filter(i => { const t = getEffectiveType(i); return t === 'SINGLE' || t === 'BOX' })
          .reduce((sum, i) => sum + i.price * i.quantity, 0)
        const isFreeShipping = newSingleBoxTotal >= businessConfig.shipping.freeThreshold

        // Only notify if the item is SINGLE or BOX (OTHER is always free shipping)
        const itemType = getEffectiveType(item)
        if (itemType === 'SINGLE' || itemType === 'BOX') {
          cartNotificationListeners.forEach(handler => handler({
            type: 'item-added',
            singleBoxTotal: newSingleBoxTotal,
            previousSingleBoxTotal: prevSingleBoxTotal,
            isFreeShipping,
            wasFreeShipping,
            freeThreshold: businessConfig.shipping.freeThreshold
          }))
        }
      },
```

Also remove the `console.log` debug statements from the current addItem.

- [ ] **Step 2: Create free shipping toast component**

Create `src/components/ui/free-shipping-toast.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface FreeShippingToastProps {
  currentTotal: number
  threshold: number
  isAchieved: boolean
  onClose: () => void
}

export function FreeShippingToast({
  currentTotal,
  threshold,
  isAchieved,
  onClose,
}: FreeShippingToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const remaining = Math.max(0, threshold - currentTotal)
  const progress = Math.min(100, (currentTotal / threshold) * 100)

  useEffect(() => {
    // Slide in
    const showTimer = setTimeout(() => setIsVisible(true), 50)

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for slide-out animation
    }, 5000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed top-4 right-4 z-[200] w-80 transition-all duration-300 ease-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`bg-white rounded-xl shadow-lg overflow-hidden ${
          isAchieved ? "border-2 border-emerald-500" : "border border-gray-200"
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{isAchieved ? "🎉" : "🚚"}</span>
              <span className="font-semibold text-sm text-gray-900">
                {isAchieved ? "Free Shipping Unlocked!" : "Free Shipping Progress"}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isAchieved ? (
            <p className="text-sm text-gray-600">
              Your order qualifies for free shipping
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Add{" "}
                <strong className="text-emerald-600 text-base">
                  ¥{remaining.toLocaleString()}
                </strong>{" "}
                more for FREE shipping!
              </p>

              {/* Progress bar */}
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">
                  ¥{currentTotal.toLocaleString()}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  ¥{threshold.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create cart notifications orchestrator**

Create `src/components/cart/cart-notifications.tsx`:

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { onCartNotification } from "@/store/cart-store"
import { FreeShippingToast } from "@/components/ui/free-shipping-toast"

interface ShippingToastState {
  show: boolean
  currentTotal: number
  threshold: number
  isAchieved: boolean
}

export function CartNotifications() {
  const [shippingToast, setShippingToast] = useState<ShippingToastState>({
    show: false,
    currentTotal: 0,
    threshold: 0,
    isAchieved: false,
  })

  const handleClose = useCallback(() => {
    setShippingToast(prev => ({ ...prev, show: false }))
  }, [])

  useEffect(() => {
    const unsubscribe = onCartNotification((event) => {
      if (event.type === 'item-added') {
        // Don't show if already at free shipping before this add
        if (event.wasFreeShipping) return

        setShippingToast({
          show: true,
          currentTotal: event.singleBoxTotal,
          threshold: event.freeThreshold,
          isAchieved: event.isFreeShipping,
        })
      }
    })

    return unsubscribe
  }, [])

  return (
    <>
      {shippingToast.show && (
        <FreeShippingToast
          currentTotal={shippingToast.currentTotal}
          threshold={shippingToast.threshold}
          isAchieved={shippingToast.isAchieved}
          onClose={handleClose}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Add CartNotifications to the app layout**

In `src/app/layout.tsx`, import and add the component. Add the import:

```typescript
import { CartNotifications } from "@/components/cart/cart-notifications"
```

Add `<CartNotifications />` inside the body, alongside the existing `<Toaster />` (or wherever global components are placed).

- [ ] **Step 5: Verify the app builds**

Run: `cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -20`
Expected: Build succeeds without errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/free-shipping-toast.tsx src/components/cart/cart-notifications.tsx src/store/cart-store.ts src/app/layout.tsx
git commit -m "feat: カート追加時に送料無料プログレスバー付きトースト通知を表示"
```

---

## Task 5: Pikachu Promo Celebration Modal (⑤)

**Files:**
- Create: `src/app/api/user/promo-eligibility/route.ts`
- Create: `src/components/ui/pikachu-promo-modal.tsx`
- Modify: `src/components/cart/cart-notifications.tsx`

- [ ] **Step 1: Create promo eligibility API endpoint**

Create directory and file `src/app/api/user/promo-eligibility/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ eligible: false, reason: "not-authenticated" })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ eligible: false, reason: "user-not-found" })
    }

    // Count completed orders (paymentStatus is PROCESSING or COMPLETED, and not cancelled)
    const completedOrderCount = await prisma.order.count({
      where: {
        userId: user.id,
        status: { not: "CANCELLED" },
        paymentStatus: { in: ["PROCESSING", "COMPLETED"] }
      }
    })

    // First-time buyer = no completed orders
    const eligible = completedOrderCount === 0

    return NextResponse.json({ eligible })
  } catch (error) {
    console.error("Error checking promo eligibility:", error)
    return NextResponse.json({ eligible: false, reason: "error" })
  }
}
```

- [ ] **Step 2: Create pikachu promo modal component**

Create `src/components/ui/pikachu-promo-modal.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface PikachuPromoModalProps {
  onClose: () => void
}

export function PikachuPromoModal({ onClose }: PikachuPromoModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-[400px] max-w-[90vw] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
          isVisible ? "scale-100" : "scale-90"
        }`}
        style={{
          background: "#1a1a2e",
          border: "2px solid #fbbf24",
        }}
      >
        {/* Header */}
        <div className="pt-7 pb-4 px-6 text-center relative">
          <div
            className="text-sm font-semibold tracking-widest uppercase mb-2"
            style={{ color: "#fbbf24" }}
          >
            ★ Special Reward ★
          </div>
          <h2 className="text-white text-xl font-extrabold">
            You Unlocked a Promo!
          </h2>
          <button
            onClick={handleClose}
            className="absolute top-3 right-4 w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90 transition-colors"
            style={{ background: "rgba(255,255,255,0.1)" }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card display */}
        <div className="px-10 pb-4 text-center">
          <div
            className="rounded-xl p-[3px]"
            style={{
              background: "linear-gradient(145deg, #fde68a, #fbbf24, #f59e0b)",
              boxShadow: "0 8px 32px rgba(251,191,36,0.3)",
            }}
          >
            <div
              className="rounded-[10px] py-6 px-4 text-center"
              style={{
                background: "linear-gradient(145deg, #fffbeb, #fef3c7)",
              }}
            >
              <div className="text-5xl mb-2">⚡</div>
              <div className="text-lg font-extrabold" style={{ color: "#92400e" }}>
                PIKACHU
              </div>
              <div
                className="text-xs font-semibold tracking-widest"
                style={{ color: "#a16207" }}
              >
                PROMO CARD
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 text-center">
          <p className="text-sm text-white/70 mb-4">
            Exclusive gift for first-time buyers
            <br />
            spending ¥50,000+
          </p>
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl text-base font-bold transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
              color: "#1a1a2e",
            }}
          >
            Continue Shopping ⚡
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Integrate pikachu promo into cart notifications**

Update `src/components/cart/cart-notifications.tsx` to add pikachu promo logic:

```tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { onCartNotification } from "@/store/cart-store"
import { FreeShippingToast } from "@/components/ui/free-shipping-toast"
import { PikachuPromoModal } from "@/components/ui/pikachu-promo-modal"

interface ShippingToastState {
  show: boolean
  currentTotal: number
  threshold: number
  isAchieved: boolean
}

const PIKACHU_PROMO_THRESHOLD = 50000
const PIKACHU_SHOWN_KEY = "pikachu-promo-shown"

export function CartNotifications() {
  const [shippingToast, setShippingToast] = useState<ShippingToastState>({
    show: false,
    currentTotal: 0,
    threshold: 0,
    isAchieved: false,
  })
  const [showPikachuPromo, setShowPikachuPromo] = useState(false)
  const [pikachuChecking, setPikachuChecking] = useState(false)

  const handleShippingClose = useCallback(() => {
    setShippingToast(prev => ({ ...prev, show: false }))
  }, [])

  const handlePikachuClose = useCallback(() => {
    setShowPikachuPromo(false)
    // Mark as shown in sessionStorage to prevent re-showing
    try {
      sessionStorage.setItem(PIKACHU_SHOWN_KEY, "true")
    } catch {
      // sessionStorage unavailable (SSR)
    }
  }, [])

  const checkPikachuEligibility = useCallback(async () => {
    // Don't check if already shown this session
    try {
      if (sessionStorage.getItem(PIKACHU_SHOWN_KEY) === "true") return
    } catch {
      // sessionStorage unavailable
    }

    if (pikachuChecking) return
    setPikachuChecking(true)

    try {
      const res = await fetch("/api/user/promo-eligibility")
      if (!res.ok) return
      const data = await res.json()
      if (data.eligible) {
        setShowPikachuPromo(true)
      }
    } catch {
      // Silently fail — promo is a nice-to-have
    } finally {
      setPikachuChecking(false)
    }
  }, [pikachuChecking])

  useEffect(() => {
    const unsubscribe = onCartNotification((event) => {
      if (event.type === 'item-added') {
        // Free shipping toast
        if (!event.wasFreeShipping) {
          setShippingToast({
            show: true,
            currentTotal: event.singleBoxTotal,
            threshold: event.freeThreshold,
            isAchieved: event.isFreeShipping,
          })
        }

        // Pikachu promo check: when total crosses ¥50,000 threshold
        if (
          event.singleBoxTotal >= PIKACHU_PROMO_THRESHOLD &&
          event.previousSingleBoxTotal < PIKACHU_PROMO_THRESHOLD
        ) {
          checkPikachuEligibility()
        }
      }
    })

    return unsubscribe
  }, [checkPikachuEligibility])

  return (
    <>
      {shippingToast.show && (
        <FreeShippingToast
          currentTotal={shippingToast.currentTotal}
          threshold={shippingToast.threshold}
          isAchieved={shippingToast.isAchieved}
          onClose={handleShippingClose}
        />
      )}
      {showPikachuPromo && (
        <PikachuPromoModal onClose={handlePikachuClose} />
      )}
    </>
  )
}
```

- [ ] **Step 4: Create the API directory**

Run: `mkdir -p src/app/api/user/promo-eligibility`

- [ ] **Step 5: Verify the app builds**

Run: `cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -20`
Expected: Build succeeds without errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/user/promo-eligibility/route.ts src/components/ui/pikachu-promo-modal.tsx src/components/cart/cart-notifications.tsx
git commit -m "feat: 初回購入5万円以上でピカチュウプロモカードお祝いモーダルを表示"
```

---

## Task 6: Final Verification & Cleanup

**Files:**
- All modified files from Tasks 1-5

- [ ] **Step 1: Full build verification**

Run: `cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx next build 2>&1 | tail -30`
Expected: Build succeeds without errors or warnings.

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd "C:/Users/admin/Desktop/開発/SamuraiCardhub" && npx tsc --noEmit 2>&1 | tail -20`
Expected: No type errors.

- [ ] **Step 3: Remove debug console.logs from cart-store.ts**

Verify that the debug `console.log` statements (lines 54, 58, 62, 67, 69, 73, 75) from the original `addItem` have been removed in the Task 4 rewrite.

- [ ] **Step 4: Verify .gitignore includes .superpowers**

Check that `.superpowers/` is in `.gitignore` (brainstorm mockup files shouldn't be committed).

```bash
grep -q "superpowers" .gitignore || echo ".superpowers/" >> .gitignore
```

- [ ] **Step 5: Final commit if any cleanup changes**

```bash
git add -A
git status
# Only commit if there are changes
git diff --cached --quiet || git commit -m "chore: 最終クリーンアップ（デバッグログ削除、gitignore更新）"
```
