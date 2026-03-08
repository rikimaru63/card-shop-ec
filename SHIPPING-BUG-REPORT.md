# Checkout Bug Report

Date: 2026-02-24

---

## 1. Cart Clear Before Navigation

`clearCart()` is called before `router.push()` succeeds. If navigation fails, the cart is empty and the order number is lost.

| Item | Detail |
|---|---|
| File | `src/app/checkout/page.tsx:241-243` |
| Current behavior | `clearCart()` executes unconditionally, then `router.push()` is called. `router.push()` is non-blocking and does not throw on failure. |
| Problem | If navigation fails (network interruption, middleware redirect, browser error), the cart is already empty. The `orderNumber` returned from `createOrder` is not stored anywhere client-side. The user cannot reach the payment page and cannot recover the order number. The order exists server-side with a 30-minute stock reservation that will expire with no user-visible recovery path. |
| Related | `isSubmitting` is never reset to `false` on the success path (`setIsSubmitting(false)` only exists in the error/else branches at lines 250, 259). If navigation stalls, the button stays permanently disabled. |

```ts
// src/app/checkout/page.tsx:241-243
if (result.success && result.orderNumber) {
  clearCart()                                            // cart wiped immediately
  router.push(`/checkout/payment/${result.orderNumber}`) // non-blocking, can fail silently
}
```

### Fix proposal

Store `orderNumber` in `sessionStorage` before navigating. Move `clearCart()` to the payment page after it confirms receipt of the order.

```ts
if (result.success && result.orderNumber) {
  sessionStorage.setItem('pendingOrderNumber', result.orderNumber)
  router.push(`/checkout/payment/${result.orderNumber}`)
  // clearCart() should be called on the payment page
}
```

---

## 2. productType Propagation Failure

`productType` becomes `undefined` through multiple paths, causing downstream calculation errors.

### 2a. Wishlist add does not include productType

All three wishlist-add call sites omit `productType`:

| Call site | File:Line | Fields passed |
|---|---|---|
| ProductCard | `src/components/products/product-card.tsx:81-90` | `id, name, image, price, category, rarity, condition, stock` |
| ProductGrid | `src/components/home/product-grid.tsx:159-168` | `id, name, image, price, category, rarity, condition, stock` |
| FeaturedSections | `src/components/home/featured-sections.tsx:70-79` | `id, name, image, price, category, rarity, condition, stock` |

`WishlistItem.productType` is typed as optional (`src/store/wishlist-store.ts:12`), so no compile error occurs.

When items move from wishlist to cart:

| Path | File:Line | Result |
|---|---|---|
| "Add All to Cart" button | `src/app/wishlist/page.tsx:16-27` | `productType: item.productType` passes `undefined` to `addToCart` |
| ProductCard "Add to Cart" on wishlist page | `src/app/wishlist/page.tsx:105` -> `product-card.tsx:67` | `productType` prop is `undefined`, passed through to `addToCart` |

### 2b. Legacy localStorage cart data lacks productType

| Item | Detail |
|---|---|
| File | `src/store/cart-store.ts:157-159` |
| persist config | `{ name: 'cart-storage' }` only. No `version`, no `migrate`, no `onRehydrateStorage`. |
| Current behavior | `zustand/persist` deserializes localStorage JSON and merges directly into the store. Items saved before `productType` was added to `CartItem` are restored without `productType`. The field is `undefined`. |
| Problem | No migration function exists to backfill `productType` on old data. No `onRehydrateStorage` callback to detect or handle this case. |

### 2c. Full productType propagation trace (normal path, no issues)

For reference, the normal path works correctly:

| Step | File:Line | productType state |
|---|---|---|
| DB column | `prisma/schema.prisma:49` | `ProductType @default(SINGLE)` - non-nullable, always `SINGLE`/`BOX`/`OTHER` |
| Products list API | `src/app/api/products/route.ts:178` | `product.productType` - always present from Prisma |
| Product detail API | `src/app/api/products/[id]/route.ts:57` | `product.productType` - always present from Prisma |
| Product detail page -> cart | `src/app/products/[id]/page.tsx:133` | `productType: product.productType` - present |
| ProductCard -> cart | `src/components/products/product-card.tsx:67` | `productType` prop - present if caller passes it |
| ProductGrid -> cart | `src/components/home/product-grid.tsx:143` | `productType: product.productType` - present |
| FeaturedSections -> cart | `src/components/home/featured-sections.tsx:56` | `productType: product.productType` - present |
| Checkout -> createOrder | `src/app/checkout/page.tsx:231` | `productType: item.productType` - passes whatever is in CartItem |

### Fix proposal

1. Add `productType` to all three wishlist-add call sites:

```ts
// product-card.tsx:81-90, product-grid.tsx:159-168, featured-sections.tsx:70-79
addToWishlist({
  id, name, image, price, category,
  productType,  // add this
  rarity, condition, stock
})
```

2. Add `version` and `migrate` to cart-store persist config:

```ts
{
  name: 'cart-storage',
  version: 1,
  migrate: (persistedState: unknown, version: number) => {
    const state = persistedState as { items: CartItem[] }
    if (version === 0) {
      state.items = state.items.map(item => ({
        ...item,
        productType: item.productType ?? 'SINGLE'
      }))
    }
    return state
  }
}
```

3. Add fallback in `addItem`:

```ts
// cart-store.ts addItem
const newItem = { ...item, quantity: qty, productType: item.productType ?? 'SINGLE' }
```

---

## 3. Shipping Calculation: undefined Bypasses All Filters

Items with `productType === undefined` are invisible to the shipping logic on both client and server.

### Client side

| Item | Detail |
|---|---|
| File | `src/store/cart-store.ts:120-144` |
| Logic | Three `.filter()` calls use strict equality: `=== 'SINGLE'`, `=== 'BOX'`, `=== 'OTHER'`. `undefined` matches none. `hasSingleOrBox` check at line 134 also uses `=== 'SINGLE' \|\| === 'BOX'`. `undefined` returns `false`. |
| Result | `undefined` items contribute to `getTotalPrice()` (line 100, no type filter) and `getCustomsFee()` (line 103, no type filter), but NOT to `singleBoxTotal` or `hasSingleOrBox`. If the cart contains only `undefined`-type items: `hasSingleOrBox = false` -> `isFreeShipping = true` -> `shipping = 0`. |

```ts
// src/store/cart-store.ts:132-136
const singleBoxTotal = singleTotal + boxTotal           // undefined items: 0
const hasSingleOrBox = items.some(
  (item) => item.productType === 'SINGLE' || item.productType === 'BOX'
)                                                        // undefined items: false
const isFreeShipping = singleBoxTotal >= 50000 || !hasSingleOrBox  // !false = true
const shipping = isFreeShipping ? 0 : 4500               // 0
```

### Server side

| Item | Detail |
|---|---|
| File | `src/app/checkout/actions.ts:19-31` |
| Logic | Identical to client: `.filter(item => item.productType === 'SINGLE' \|\| item.productType === 'BOX')`. Same strict equality. Same result for `undefined`. |
| `CartItem` type | `productType?: ProductType` (line 15) - optional, accepts `undefined` from client |

### Affected scenarios

| Scenario | Expected shipping | Actual shipping |
|---|---|---|
| BOX item (Y5,000) added via wishlist | Y4,500 | Y0 (FREE) |
| SINGLE item (Y3,000) from old localStorage | Y4,500 | Y0 (FREE) |
| Normal BOX (Y5,000) + wishlist SINGLE (Y40,000) | Y4,500 (singleBoxTotal = Y45,000) | Y4,500, but threshold uses Y5,000 only (SINGLE is invisible) |

### Fix proposal

Replace strict equality with a fallback function in both files:

```ts
// Shared logic for both cart-store.ts and actions.ts
const getEffectiveType = (item: CartItem) => item.productType ?? 'SINGLE'

const singleBoxTotal = items
  .filter(item => { const t = getEffectiveType(item); return t === 'SINGLE' || t === 'BOX' })
  .reduce((total, item) => total + item.price * item.quantity, 0)

const hasSingleOrBox = items.some(item => {
  const t = getEffectiveType(item)
  return t === 'SINGLE' || t === 'BOX'
})
```

Fallback to `'SINGLE'` matches the DB schema default (`@default(SINGLE)`).

---

## 4. BOX 5-Unit Minimum: Server-Side Validation Missing

The BOX minimum order quantity (5 units) is enforced only on the client. The server action accepts any quantity.

### Client-side validation (exists)

| Location | File:Line | Implementation |
|---|---|---|
| Store logic | `src/store/cart-store.ts:150-155` | `return boxCount === 0 \|\| boxCount >= 5` |
| Cart page button | `src/app/cart/page.tsx` | `disabled={!boxOrderValid}` |
| Checkout page button | `src/app/checkout/page.tsx:725` | `disabled={isSubmitting \|\| !isAddressValid() \|\| !boxOrderValid}` |

### Server-side validation (missing)

| Location | File:Line | What exists |
|---|---|---|
| `createOrder` | `src/app/checkout/actions.ts:124-318` | Validates: cart non-empty (132), user exists (141), stock availability (146). Does NOT check BOX count. |
| `calculateShipping` | `src/app/checkout/actions.ts:19-31` | Uses `productType` for shipping only. No quantity validation. |
| `OrderItem` creation | `src/app/checkout/actions.ts:229-239` | `productType` is not saved to OrderItem. Only `productId, quantity, price, total, snapshot{name,price,image}`. |

Server Actions are HTTP endpoints callable directly. The client-side `disabled` button provides no protection against direct API calls.

### Fix proposal

Add validation in `createOrder` after stock check (after line 155):

```ts
// src/app/checkout/actions.ts - after line 155
const boxItemCount = items
  .filter(item => item.productType === 'BOX')
  .reduce((total, item) => total + item.quantity, 0)

if (boxItemCount > 0 && boxItemCount < 5) {
  return {
    success: false,
    message: `BOX products require a minimum order of 5. Current: ${boxItemCount}`
  }
}
```

Note: This check has the same `undefined` vulnerability as the shipping calculation. If `productType` is `undefined`, BOX items are not counted, and the validation is bypassed. The `undefined` fallback from section 3 should be applied here as well.

---

## 5. lastName Always Empty String on New Address Orders

The new address form has a single "Contact Name" field mapped to `firstName` only. `lastName` is never populated.

### Form field

| Item | Detail |
|---|---|
| File | `src/app/checkout/page.tsx:518-524` |
| Label | "Contact Name" with placeholder "John Doe" |
| Binding | `value={newAddress.firstName}`, `onChange` sets `newAddress.firstName` |
| `lastName` | No input field exists. Initial value is `""` (line 126). Never modified by user input. |

### Validation

| Location | File:Line | lastName checked? |
|---|---|---|
| `getSelectedAddress()` | `src/app/checkout/page.tsx:185-187` | No. Validates `firstName, street1, city, state, postalCode, country` only. |
| `isAddressValid()` | `src/app/checkout/page.tsx:314-318` | No. Same fields as above. |
| `createOrder` server action | `src/app/checkout/actions.ts:124-318` | No address field validation exists. |

### Where lastName is used

| Usage | File:Line | Value |
|---|---|---|
| Address save to DB | `src/app/checkout/actions.ts:255` | `lastName: shippingAddress.lastName` -> `""` |
| Invoice email customer name | `src/app/checkout/actions.ts:284` | `` `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() `` -> first name only with trailing space trimmed |
| Billing address JSON | `src/app/checkout/actions.ts:227` | `shippingAddress as object` -> `lastName: ""` stored in JSON |

### Downstream impact

FedEx shipping API requires a non-empty last name for most shipment types. Orders created through this form will have `lastName: ""` in the database and in the shipping address payload.

### Fix proposal

Split "Contact Name" into two fields:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
    <Input
      id="firstName"
      value={newAddress.firstName}
      onChange={(e) => setNewAddress({...newAddress, firstName: e.target.value})}
      placeholder="John"
    />
  </div>
  <div>
    <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
    <Input
      id="lastName"
      value={newAddress.lastName}
      onChange={(e) => setNewAddress({...newAddress, lastName: e.target.value})}
      placeholder="Doe"
    />
  </div>
</div>
```

Add `lastName` to validation in both `getSelectedAddress()` and `isAddressValid()`:

```ts
// getSelectedAddress line 185
if (!newAddress.firstName || !newAddress.lastName || !newAddress.street1 || ...)

// isAddressValid line 315
return newAddress.firstName && newAddress.lastName && newAddress.street1 && ...
```

---

## 6. isSubmitting Not Reset on Success Path

| Item | Detail |
|---|---|
| File | `src/app/checkout/page.tsx:222,250,259` |
| Current behavior | `setIsSubmitting(true)` is called at line 222. On success (line 241), `clearCart()` and `router.push()` are called but `setIsSubmitting(false)` is never called. It is only called in the error branch (line 250) and catch block (line 259). |
| Problem | If `router.push()` is slow or the component stays mounted (e.g., soft navigation delay), the "Confirm Order" button remains in "Processing..." disabled state indefinitely. The user cannot retry or interact with the page. |

### Fix proposal

Use `finally` block to always reset `isSubmitting`:

```ts
} finally {
  setIsSubmitting(false)
}
```

---

## Summary

| # | Issue | Severity | Client | Server |
|---|---|---|---|---|
| 1 | clearCart before navigation | High | `checkout/page.tsx:242` | N/A |
| 2 | productType undefined (wishlist + legacy localStorage) | High | `product-card.tsx:81-90`, `product-grid.tsx:159-168`, `featured-sections.tsx:70-79`, `cart-store.ts:157-159` | N/A |
| 3 | Shipping: undefined bypasses filters | High | `cart-store.ts:120-144` | `actions.ts:19-31` |
| 4 | BOX 5-unit minimum server validation missing | High | Exists (`cart-store.ts:150-155`) | Missing (`actions.ts:124-318`) |
| 5 | lastName always empty string | Medium | `checkout/page.tsx:518-524` | `actions.ts:255,284` |
| 6 | isSubmitting not reset on success | Medium | `checkout/page.tsx:222,250,259` | N/A |
