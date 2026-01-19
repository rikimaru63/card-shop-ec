import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProductType = 'SINGLE' | 'BOX' | 'OTHER'

export interface WishlistItem {
  id: string
  name: string
  image: string
  price: number
  category?: string
  productType?: ProductType
  rarity?: string
  condition?: string
  stock: number
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (id: string) => void
  isInWishlist: (id: string) => boolean
  clearWishlist: () => void
  getTotalItems: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          const exists = state.items.some((i) => i.id === item.id)
          if (exists) return state
          
          return {
            items: [...state.items, item],
          }
        })
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },
      
      isInWishlist: (id) => {
        return get().items.some((item) => item.id === id)
      },
      
      clearWishlist: () => {
        set({ items: [] })
      },
      
      getTotalItems: () => {
        return get().items.length
      },
    }),
    {
      name: 'wishlist-storage',
    }
  )
)