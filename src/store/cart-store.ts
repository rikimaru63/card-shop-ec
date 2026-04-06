import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CUSTOMS_RATE } from '@/lib/constants'
import { businessConfig } from '@/lib/config/business'

// DB上のデフォルトと一致させる（prisma: @default(SINGLE)）
const getEffectiveType = (item: { productType?: ProductType }): ProductType =>
  item.productType ?? 'SINGLE'

export type ProductType = 'SINGLE' | 'BOX' | 'OTHER'

export interface CartItem {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  category?: string
  rarity?: string
  condition?: string
  stock: number
  productType?: ProductType
}

interface ShippingInfo {
  shipping: number
  isFreeShipping: boolean
  singleBoxTotal: number
  otherTotal: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  getCustomsFee: () => number
  getBoxCount: () => number
  getTotalPriceByType: (type: ProductType) => number
  getShippingInfo: () => ShippingInfo
  hasBoxItems: () => boolean
  isBoxOrderValid: () => boolean
}

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

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
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
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock)) }
              : item
          ).filter((item) => item.quantity > 0),
        }))
      },
      
      clearCart: () => {
        set({ items: [] })
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getCustomsFee: () => {
        const subtotal = get().getTotalPrice()
        return Math.floor(subtotal * CUSTOMS_RATE)
      },

      getBoxCount: () => {
        return get().items
          .filter((item) => getEffectiveType(item) === 'BOX')
          .reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPriceByType: (type: ProductType) => {
        return get().items
          .filter((item) => getEffectiveType(item) === type)
          .reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getShippingInfo: () => {
        const items = get().items
        const singleTotal = items
          .filter((item) => getEffectiveType(item) === 'SINGLE')
          .reduce((total, item) => total + item.price * item.quantity, 0)
        const boxTotal = items
          .filter((item) => getEffectiveType(item) === 'BOX')
          .reduce((total, item) => total + item.price * item.quantity, 0)
        const otherTotal = items
          .filter((item) => getEffectiveType(item) === 'OTHER')
          .reduce((total, item) => total + item.price * item.quantity, 0)

        // シングル + BOX の合計が¥50,000以上で送料無料（BOX/SINGLEが0個の場合も送料不要）
        const singleBoxTotal = singleTotal + boxTotal
        const hasSingleOrBox = items.some((item) => {
          const t = getEffectiveType(item)
          return t === 'SINGLE' || t === 'BOX'
        })
        const isFreeShipping = singleBoxTotal >= businessConfig.shipping.freeThreshold || !hasSingleOrBox
        const shipping = isFreeShipping ? 0 : businessConfig.shipping.baseCost

        return {
          shipping,
          isFreeShipping,
          singleBoxTotal,
          otherTotal
        }
      },

      hasBoxItems: () => {
        return get().items.some((item) => getEffectiveType(item) === 'BOX')
      },

      isBoxOrderValid: () => {
        const boxCount = get().getBoxCount()
        // BOX商品がない場合は有効（制限なし）
        // BOX商品がある場合は5個以上必要
        return boxCount === 0 || boxCount >= businessConfig.box.minimumQuantity
      },
    }),
    {
      name: 'cart-storage',
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { items: CartItem[] }
        if (version === 0 && state.items) {
          // 旧データにproductTypeがない場合、SINGLEをデフォルトとする
          state.items = state.items.map(item => ({
            ...item,
            productType: item.productType ?? 'SINGLE'
          }))
        }
        return state
      },
    }
  )
)