import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        console.log('🏪 Cart Store: addItem called with:', item)
        
        set((state) => {
          console.log('📊 Current cart state:', state.items)
          const existingItem = state.items.find((i) => i.id === item.id)
          
          if (existingItem) {
            console.log('🔄 Item exists, incrementing quantity')
            // アイテムが既に存在する場合、数量を増やす
            const newItems = state.items.map((i) =>
              i.id === item.id
                ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
                : i
            )
            console.log('✅ Updated cart:', newItems)
            return { items: newItems }
          }
          
          console.log('➕ Adding new item to cart')
          // 新しいアイテムを追加
          const newItems = [...state.items, { ...item, quantity: 1 }]
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
    }),
    {
      name: 'cart-storage',
    }
  )
)