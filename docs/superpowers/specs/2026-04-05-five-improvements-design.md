# Samurai Card Hub — 5 Improvements Design Spec

**Date:** 2026-04-05
**Status:** Draft
**Scope:** 5 client-requested improvements to the Samurai Card Hub platform

---

## Overview

5 independent improvements requested by the client to improve the shopping experience and admin operations:

1. Sold-out products sorted to back of listings
2. Stock release button in admin order management
3. Admin product filter bug fix
4. Free shipping progress toast notification
5. Pikachu promo celebration modal for first-time buyers

---

## ① Sold-Out Products Sort to Back

### Goal
All product listings across the site should display in-stock items first, with sold-out (stock = 0) items pushed to the end.

### Scope
- Public products API (`/api/products`)
- Admin products API (`/api/admin/products`)
- Homepage product grid
- Search results
- Any page using the products API

### Design

**Approach: Two-phase query with Prisma**

Prisma doesn't natively support `CASE WHEN` in `orderBy`. Using `$queryRaw` would work but loses type safety and requires rewriting the entire query including all filter logic. Instead, use a practical Prisma-native approach:

**Split the query into two groups and concatenate results:**

```typescript
// 1. Fetch in-stock products with user's sort
const inStock = await prisma.product.findMany({
  where: { ...where, stock: { gt: 0 } },
  orderBy: existingOrderBy,
  skip: adjustedSkip,
  take: adjustedTake,
  include: { ... }
})

// 2. Fetch out-of-stock products with user's sort
const outOfStock = await prisma.product.findMany({
  where: { ...where, stock: { equals: 0 } },
  orderBy: existingOrderBy,
  skip: adjustedSkip2,
  take: adjustedTake2,
  include: { ... }
})

// 3. Combine: in-stock first, then out-of-stock
const products = [...inStock, ...outOfStock]
```

**Pagination handling:**
- Count in-stock and out-of-stock separately
- Calculate which page boundary falls in which group
- Adjust skip/take for each group based on overall page position
- Total count = inStockCount + outOfStockCount

This approach:
- Keeps full Prisma type safety
- Works correctly with pagination (no duplicates, no gaps)
- Preserves user's chosen sort within each group
- No raw SQL needed
- Products with `trackStock: false` treated as in-stock (stock field is still populated)

### Affected Files
- `src/app/api/products/route.ts` — Public products API
- `src/app/api/admin/products/route.ts` — Admin products API

### Edge Cases
- Products with `trackStock: false` should be treated as in-stock
- New products with stock=0 (not yet stocked) still go to back — this is correct behavior
- Featured/recommended sections (`isNewArrival`, `isRecommended`) should also respect this sort

### Testing
- Verify in-stock products appear before out-of-stock in default sort
- Verify sort is maintained when user selects price/name/newest sort
- Verify pagination works correctly (no duplicates, no gaps)
- Verify admin page sorting is also affected

---

## ② Stock Release Button in Admin

### Goal
Allow administrators to release (restore) stock for orders where customers clicked "Payment Complete" without actually paying via Wise. One-click per order restores all items.

### Background

**Current payment flow:**
1. Customer places order → Stock reserved (not decremented)
2. Customer sees Wise QR/payment page
3. Customer clicks "Payment Complete" → `confirmPayment()` called → Stock decremented, reservation confirmed
4. Admin verifies Wise payment manually

**Problem:** Step 3 decrements stock regardless of actual payment. Customers can:
- Click "Payment Complete" without paying → stock gone, no money received
- NOT click "Payment Complete" after paying → stock not decremented, admin must manually adjust

**This spec addresses:** Adding a "Release Stock" action for admins to reverse step 3 for fraudulent/mistaken payment confirmations.

### Design

**New Server Action: `releaseOrderStock(orderNumber: string)`**

Location: `src/app/admin/actions.ts` (new file — admin actions are separated from customer-facing checkout actions)

Logic:
1. Find order by orderNumber
2. Verify order exists and has confirmed stock reservations
3. Guard: Refuse if order status is SHIPPED or DELIVERED (product already sent)
4. In a transaction:
   a. Find all confirmed reservations for this order
   b. Increment stock for each product by reservation quantity
   c. Delete all reservations for this order
   d. Update order paymentStatus to "CANCELLED"
   e. Update order status to "CANCELLED"
   f. Add admin note: "Stock released by admin at [timestamp]"
5. Revalidate relevant paths

**Admin UI Changes:**

Location: `src/app/admin/orders/page.tsx` (or the order management component)

Add a "Release Stock" button to the order actions:
- Visible when: order has paymentStatus "PROCESSING" (customer clicked Payment Complete but admin hasn't confirmed Wise receipt)
- Button label: "Release Stock" with a package/undo icon
- Confirmation dialog: "Are you sure? This will restore all items from this order to inventory and cancel the order."
- On success: Toast notification "Stock released for order CS-XXXXX"

**Admin Order List Enhancement:**

Add a filter/view for "Payment Declared but Unverified" orders:
- Filter by: paymentStatus = "PROCESSING" AND no actual Wise payment confirmed
- This helps admins quickly identify potentially fraudulent payment declarations

### Affected Files
- New: `src/app/admin/actions.ts` — New server action for admin operations
- Admin order management component — UI button and confirmation dialog
- `src/app/api/admin/orders/[id]/route.ts` — Possible API endpoint addition

### Edge Cases
- Order with mix of trackStock true/false products — only restore tracked items
- Order already cancelled — show appropriate message, don't double-restore
- Race condition: admin clicks release while customer is completing real payment — use transaction isolation
- Multiple admins clicking release simultaneously — idempotent operation (check if already released)

### Testing
- Release stock for a PROCESSING order → verify stock incremented correctly
- Attempt release on SHIPPED order → verify rejection
- Attempt release on already-cancelled order → verify appropriate message
- Verify released stock appears correctly in product listings

---

## ③ Admin Product Filter Bug Fix

### Goal
Fix multiple filter-related bugs in the admin product management page.

### Bugs Identified

**Bug 1: Search + Filter OR Overwrite (CRITICAL)**

File: `src/app/api/admin/products/route.ts` line 46

```typescript
// CURRENT (broken):
if (search) {
  where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    // ...
  ]
}
```

When search is active, `where.OR` is set. If cardSet multi-select also uses `where.AND` containing `OR`, the search OR clause operates at the top level of `where`, which changes the semantics of the entire query.

The Prisma `where` ends up as:
```
WHERE (name LIKE search OR nameJa LIKE search ...) AND (other filters)
```

This is actually correct IF no other filter uses `where.OR`. But if cardSet multi-select adds to `where.AND`, the interaction is:
```
WHERE (OR: name/nameJa/cardNumber/sku) AND (AND: [OR: cardSets])
```

This should work correctly. **However**, the real issue is likely:

**Bug 2: InStock Filter + Limit Interaction**

The admin client fetches with `limit=500`. If there are more than 500 products matching the filters, some products are cut off. When InStock filter is toggled, the result set changes and products appear/disappear unpredictably.

File: `src/components/admin/AdminProductsClient.tsx` line 69
```typescript
params.set("limit", "500")
```

If the store has >500 in-stock products, the InStock filter may show different subsets depending on sort order.

**Bug 3: `updatedAt` Sort Not Implemented**

File: `src/app/api/admin/products/route.ts` — switch statement has no case for `updatedAt`

UI offers "Last Updated" sort option but API ignores it, falling back to default `sortOrder`.

**Bug 4: Search OR Overwrite (Same as public API)**

File: `src/app/api/products/route.ts` — Same `where.OR` pattern exists in the public products API.

### Fixes

**Fix 1: Wrap search in AND**
```typescript
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

**Fix 2: Remove hard limit or increase significantly**
- Increase limit to a safe high number or implement proper server-side pagination for filtered views
- Alternative: When InStock filter is active, return count-accurate paginated results

**Fix 3: Add `updatedAt` case to sort switch**
```typescript
case 'updatedAt':
  orderBy = [{ updatedAt: 'desc' }]
  break
```

**Fix 4: Apply same search fix to public API**

### Affected Files
- `src/app/api/admin/products/route.ts` — Filter logic fixes
- `src/app/api/products/route.ts` — Same search fix for public API
- `src/components/admin/AdminProductsClient.tsx` — Limit adjustment

### Testing
- Search + rarity filter: verify results match BOTH criteria
- Search + cardSet filter: verify correct AND behavior
- InStock toggle: verify all in-stock products appear (not truncated)
- updatedAt sort: verify products sorted by last update
- Multiple filters simultaneously: verify correct intersection

---

## ④ Free Shipping Progress Toast

### Goal
When a customer adds a product to cart, show a toast notification indicating how much more they need to spend for free shipping. Uses a progress bar design (Design A selected).

### Design

**Toast Component: `FreeShippingToast`**

Visual Design (approved mockup):
- Position: Top-right corner, slides in from right
- Width: 320px
- White background, rounded corners (12px), subtle shadow
- Truck icon (🚚) + "Free Shipping Progress" header
- Text: "Add ¥XX,XXX more for FREE shipping!"
- Green progress bar showing current cart total vs ¥50,000 threshold
- Labels: current total on left, ¥50,000 on right
- Close button (✕) in top-right corner
- Auto-dismiss after 5 seconds, or manual close via ✕

**Free Shipping Achieved Variant:**
- Same position and style
- Green border highlight (2px solid #10b981)
- 🎉 icon + "Free Shipping Unlocked!" header
- Text: "Your order qualifies for free shipping"

**Trigger Logic:**

Location: `src/store/cart-store.ts` — `addItem` action

When an item is added to cart:
1. Calculate new cart total (SINGLE + BOX items only, per existing business logic)
2. If total < freeThreshold (¥50,000): Show progress toast with remaining amount
3. If total >= freeThreshold: Show "Free Shipping Unlocked!" toast
4. If total was already >= freeThreshold before adding: Don't show toast (already free)

**Implementation Approach:**

- Create a `FreeShippingToast` component in `src/components/ui/`
- Leverage existing Radix UI Toast system (`@radix-ui/react-toast`) and `use-toast` hook already in the codebase
- The existing toast infrastructure (`src/components/ui/toast.tsx`, `src/components/ui/toaster.tsx`, `src/hooks/use-toast.ts`) provides the notification framework
- Cart store integration: Use Zustand's `subscribe` to watch cart total changes and trigger toast
- FreeShippingToast is a custom-styled toast variant with progress bar, not a plain text toast

**Configuration:**
- Threshold from `businessConfig.shipping.freeThreshold`
- Only count SINGLE + BOX product types (existing logic)
- OTHER type products are excluded from calculation (existing behavior)

### Affected Files
- New: `src/components/ui/free-shipping-toast.tsx` — Toast component
- `src/store/cart-store.ts` — Trigger toast on addItem
- `src/components/home/product-grid.tsx` — Wire up toast display (if add-to-cart happens here)
- Any component with "Add to Cart" button

### Edge Cases
- Cart already at free shipping → don't show progress toast when adding more items
- Item removal bringing cart below threshold → no toast (only triggers on add)
- BOX minimum not met → toast still shows shipping progress (separate concern)
- OTHER-only cart → no toast (shipping is always free for OTHER)
- Multiple rapid additions → debounce or only show latest toast

### Testing
- Add item when cart is empty: verify toast shows with correct remaining amount
- Add item that pushes total over ¥50,000: verify "Unlocked!" variant
- Add item when already over threshold: verify no toast
- Close toast with ✕: verify it dismisses
- Verify auto-dismiss after 5 seconds
- Verify correct calculation (SINGLE/BOX only)

---

## ⑤ Pikachu Promo Celebration Modal

### Goal
When a first-time buyer's cart total reaches ¥50,000+, show a celebration modal announcing they'll receive a free Pikachu promo card. Uses Card Reveal design (Design B selected).

### Design

**Modal Component: `PikachuPromoModal`**

Visual Design (approved mockup):
- Full-screen overlay with dark semi-transparent background
- Modal: 400px wide, dark theme (#1a1a2e background), gold border (#fbbf24)
- Header: "★ Special Reward ★" label + "You Unlocked a Promo!" title
- Center: Gold-bordered card with ⚡ Pikachu icon, "PIKACHU PROMO CARD" text
- Footer: "Exclusive gift for first-time buyers spending ¥50,000+" + "Continue Shopping ⚡" button
- Close button (✕) in top-right corner

**First-Time Buyer Detection:**

A "first-time buyer" is defined as a user with no previous COMPLETED orders (paymentStatus = "COMPLETED" or status = "DELIVERED").

Detection approach:
- When cart total crosses ¥50,000, make an API call to check if user is a first-time buyer
- API endpoint: `GET /api/user/promo-eligibility` (new)
- Returns: `{ eligible: boolean, reason?: string }`
- Server checks: user has 0 orders with paymentStatus in ["COMPLETED", "PROCESSING"] AND status not "CANCELLED"

**Trigger Logic:**

Location: Cart store or cart page component

1. Monitor cart total (SINGLE + BOX items, same as shipping calculation)
2. When total crosses ¥50,000 threshold (going up, not already above):
   a. Check if user is logged in → if not, don't show (they'll see it after login if eligible)
   b. Call `/api/user/promo-eligibility`
   c. If eligible: show modal
   d. If not eligible (repeat buyer): don't show
3. Store shown state in sessionStorage to prevent re-showing in same session
4. Modal dismisses on ✕ click or "Continue Shopping" button click

**API Endpoint: `/api/user/promo-eligibility`**

```typescript
// GET /api/user/promo-eligibility
// Requires auth (session)
// Returns: { eligible: boolean }

// Logic:
// 1. Get current user from session
// 2. Count orders where paymentStatus in ['COMPLETED', 'PROCESSING'] AND status != 'CANCELLED'
// 3. If count === 0, eligible = true
// 4. Return result
```

**Future Considerations:**
- The promo is described as ongoing (not time-limited for now)
- If it becomes time-limited later, add `startDate`/`endDate` fields to a promo configuration
- Consider admin UI to toggle promo on/off — defer to future request
- The promo card itself is a fulfillment concern (admin packs it with the order) — no system tracking needed for MVP

### Affected Files
- New: `src/components/ui/pikachu-promo-modal.tsx` — Modal component
- New: `src/app/api/user/promo-eligibility/route.ts` — Eligibility API
- `src/store/cart-store.ts` or cart page — Trigger logic
- `src/components/home/product-grid.tsx` — Wire up if add-to-cart triggers here

### Edge Cases
- User not logged in → don't show modal (can't check order history)
- User adds items to exactly ¥50,000 → eligible (threshold is >=)
- User removes items below ¥50,000 then re-adds → show modal again if not shown this session
- User has a cancelled order only → still counts as first-time buyer
- User has a PENDING order (not yet paid) → still counts as first-time buyer
- Multiple tabs → sessionStorage is per-tab, may show in each tab (acceptable)

### Testing
- First-time buyer at ¥50,000+: verify modal appears
- Repeat buyer at ¥50,000+: verify modal does NOT appear
- Cart below ¥50,000: verify no modal
- Close modal: verify it doesn't reappear in same session
- Not logged in: verify no modal (no error)
- User with only cancelled orders: verify modal appears (still first-time)

---

## Architecture Notes

### Shared Concerns

**Toast/Notification System:**
④ and ⑤ both need UI notification/modal capabilities. Implement a lightweight notification system that can be reused:
- Toast notifications (④) — positioned top-right, auto-dismiss
- Modal overlays (⑤) — centered, manual dismiss

The codebase already has Radix UI Toast (`@radix-ui/react-toast`) with `use-toast` hook and Toaster component. Use this for ④. For ⑤, the modal is a standalone component with its own overlay — doesn't use the toast system.

**Cart Store Integration:**
Both ④ and ⑤ trigger from cart state changes. The cart store (`src/store/cart-store.ts`) needs to support callbacks or events when items are added. Options:
- Add a return value from `addItem` containing cart totals
- Use Zustand `subscribe` to watch for total changes
- Emit a custom event that UI components listen to

**Recommended:** Use Zustand's `subscribe` with a selector on the computed totals. This is the cleanest approach and doesn't pollute the store API.

### Implementation Order

Recommended sequence based on dependencies and risk:

1. **③ Filter bug fix** — Pure bug fix, no dependencies, reduces admin pain immediately
2. **① Sold-out sort** — Pure backend change, no UI components needed
3. **② Stock release button** — Requires admin UI changes but self-contained
4. **④ Free shipping toast** — Requires toast component and cart store integration
5. **⑤ Pikachu promo modal** — Requires new API, modal component, and cart store integration. Builds on patterns established in ④

Items ④ and ⑤ share cart store integration work, so doing them in sequence is efficient.

---

## Out of Scope

- Wise API integration for automatic payment verification (separate initiative)
- Admin promo management UI (toggle promos on/off)
- Promo card inventory tracking
- Email notification for promo eligibility
- Mobile-specific toast/modal designs (responsive design within existing breakpoints is sufficient)
