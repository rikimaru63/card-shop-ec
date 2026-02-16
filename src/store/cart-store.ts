import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item, quantity = 1) => {
        console.log('🏪 Cart Store: addItem called with:', item, 'qty:', quantity)
        const qty = Math.max(1, Math.min(quantity, item.stock))
        
        set((state) => {
          console.log('📊 Current cart state:', state.items)
          const existingItem = state.items.find((i) => i.id === item.id)
          
          if (existingItem) {
            console.log('🔄 Item exists, incrementing quantity by', qty)
            // アイテムが既に存在する場合、数量を増やす
            const newItems = state.items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) }
                : i
            )
            console.log('✅ Updated cart:', newItems)
            return { items: newItems }
          }
          
          console.log('➕ Adding new item to cart')
          // 新しいアイテムを追加
          const newItems = [...state.items, { ...item, quantity: qty }]
          console.log('✅ New cart:', newItems)
          return { items: newItems }
        })
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
        // EU version: no customs fee
        return 0
      },

      getBoxCount: () => {
        return get().items
          .filter((item) => item.productType === 'BOX')
          .reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPriceByType: (type: ProductType) => {
        return get().items
          .filter((item) => item.productType === type)
          .reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getShippingInfo: () => {
        const items = get().items
        const singleTotal = items
          .filter((item) => item.productType === 'SINGLE')
          .reduce((total, item) => total + item.price * item.quantity, 0)
        const boxTotal = items
          .filter((item) => item.productType === 'BOX')
          .reduce((total, item) => total + item.price * item.quantity, 0)
        const otherTotal = items
          .filter((item) => item.productType === 'OTHER')
          .reduce((total, item) => total + item.price * item.quantity, 0)

        // シングル + BOX の合計が¥50,000以上で送料無料
        const singleBoxTotal = singleTotal + boxTotal
        const isFreeShipping = singleBoxTotal >= 50000 || singleBoxTotal === 0
        const shipping = isFreeShipping ? 0 : 4500

        return {
          shipping,
          isFreeShipping,
          singleBoxTotal,
          otherTotal
        }
      },

      hasBoxItems: () => {
        return get().items.some((item) => item.productType === 'BOX')
      },

      isBoxOrderValid: () => {
        const boxCount = get().getBoxCount()
        // BOX商品がない場合は有効（制限なし）
        // BOX商品がある場合は5個以上必要
        return boxCount === 0 || boxCount >= 5
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)