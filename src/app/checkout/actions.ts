"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendInvoiceEmail } from "@/lib/email"

type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

type ShippingAddress = {
  firstName: string
  lastName: string
  street1: string
  street2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone?: string
}

type CreateOrderInput = {
  items: CartItem[]
  email: string
  shippingAddress: ShippingAddress
  saveAddress?: boolean
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CS-${timestamp}-${random}`
}

// Check stock availability for all items
async function checkStockAvailability(items: CartItem[]): Promise<{
  available: boolean
  unavailableItems: { name: string; requested: number; available: number }[]
}> {
  const unavailableItems: { name: string; requested: number; available: number }[] = []

  for (const item of items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: { stock: true, name: true, trackStock: true }
    })

    if (!product) {
      unavailableItems.push({
        name: item.name,
        requested: item.quantity,
        available: 0
      })
      continue
    }

    // If stock tracking is enabled and stock is insufficient
    if (product.trackStock && product.stock < item.quantity) {
      unavailableItems.push({
        name: product.name,
        requested: item.quantity,
        available: product.stock
      })
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems
  }
}

export async function createOrder(input: CreateOrderInput): Promise<{
  success: boolean
  orderNumber?: string
  message?: string
}> {
  try {
    const { items, email, shippingAddress, saveAddress } = input

    if (!items || items.length === 0) {
      return { success: false, message: "カートが空です" }
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { success: false, message: "ユーザーが見つかりません" }
    }

    // Check stock availability
    const stockCheck = await checkStockAvailability(items)
    if (!stockCheck.available) {
      const itemList = stockCheck.unavailableItems
        .map(item => `${item.name}（在庫: ${item.available}個）`)
        .join(", ")
      return {
        success: false,
        message: `在庫不足: ${itemList}`
      }
    }

    // Calculate totals (JPY)
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shipping = subtotal >= 10000 ? 0 : 1500
    const tax = 0
    const total = subtotal + shipping + tax

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Use transaction to create order AND reduce stock atomically
    const order = await prisma.$transaction(async (tx) => {
      // 1. Reduce stock for each item
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { trackStock: true, stock: true }
        })

        if (product?.trackStock) {
          // Double-check stock in transaction
          if (product.stock < item.quantity) {
            throw new Error(`在庫不足: ${item.name}`)
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity }
            }
          })
        }
      }

      // 2. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          email: user.email,
          subtotal,
          tax,
          shipping,
          total,
          currency: "JPY",
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "wise",
          shippingAddress: shippingAddress as object,
          billingAddress: shippingAddress as object,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              snapshot: {
                name: item.name,
                price: item.price,
                image: item.image
              }
            }))
          }
        },
        include: {
          items: true
        }
      })

      // 3. Save address if requested
      if (saveAddress) {
        await tx.address.create({
          data: {
            userId: user.id,
            type: "SHIPPING",
            isDefault: true,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            street1: shippingAddress.street1,
            street2: shippingAddress.street2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone
          }
        })

        // Set other addresses as non-default
        await tx.address.updateMany({
          where: {
            userId: user.id,
            type: "SHIPPING",
            NOT: { id: newOrder.id }
          },
          data: { isDefault: false }
        })
      }

      return newOrder
    })

    // Send invoice email
    const emailResult = await sendInvoiceEmail({
      to: user.email,
      orderNumber: order.orderNumber,
      customerName: `${shippingAddress.lastName} ${shippingAddress.firstName}` || user.name || user.email,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      shipping,
      total,
      currency: "JPY"
    })

    if (!emailResult.success) {
      console.warn("Failed to send invoice email:", emailResult.error)
    }

    // Revalidate pages
    revalidatePath("/account/orders")
    revalidatePath("/admin/orders")
    revalidatePath("/products")
    revalidatePath("/admin/products")

    return {
      success: true,
      orderNumber: order.orderNumber
    }
  } catch (error) {
    console.error("Failed to create order:", error)
    const errorMessage = error instanceof Error ? error.message : "注文の作成に失敗しました。もう一度お試しください。"
    return {
      success: false,
      message: errorMessage
    }
  }
}

export async function getOrderByNumber(orderNumber: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return order
  } catch (error) {
    console.error("Failed to fetch order:", error)
    return null
  }
}

// Cancel order and restore stock
export async function cancelOrder(orderNumber: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    })

    if (!order) {
      return { success: false, message: "注文が見つかりません" }
    }

    if (order.status === "CANCELLED") {
      return { success: false, message: "この注文は既にキャンセルされています" }
    }

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return { success: false, message: "発送済みの注文はキャンセルできません" }
    }

    // Use transaction to update order status AND restore stock
    await prisma.$transaction(async (tx) => {
      // 1. Restore stock for each item
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { trackStock: true }
        })

        if (product?.trackStock) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity }
            }
          })
        }
      }

      // 2. Update order status
      await tx.order.update({
        where: { orderNumber },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED"
        }
      })
    })

    revalidatePath("/account/orders")
    revalidatePath("/admin/orders")
    revalidatePath("/products")
    revalidatePath("/admin/products")

    return { success: true }
  } catch (error) {
    console.error("Failed to cancel order:", error)
    return { success: false, message: "キャンセルに失敗しました" }
  }
}

// Get user's saved addresses
export async function getUserAddresses(userId: string) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    return addresses
  } catch (error) {
    console.error("Failed to fetch addresses:", error)
    return []
  }
}
