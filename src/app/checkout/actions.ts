"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendInvoiceEmail } from "@/lib/email"

type ProductType = 'SINGLE' | 'BOX' | 'OTHER'

type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  productType?: ProductType
}

// Calculate shipping based on product types
function calculateShipping(items: CartItem[]): { shipping: number; singleBoxTotal: number } {
  // シングルカードとBOXの合計金額を計算
  const singleBoxTotal = items
    .filter(item => item.productType === 'SINGLE' || item.productType === 'BOX')
    .reduce((total, item) => total + item.price * item.quantity, 0)

  // シングル + BOX の合計が¥50,000以上、またはシングル/BOXが含まれない場合は送料無料
  const hasSingleOrBox = items.some(item => item.productType === 'SINGLE' || item.productType === 'BOX')
  const isFreeShipping = singleBoxTotal >= 50000 || !hasSingleOrBox
  const shipping = isFreeShipping ? 0 : 4500

  return { shipping, singleBoxTotal }
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

// Get available stock (actual stock minus active reservations)
async function getAvailableStock(productId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, trackStock: true }
  })

  if (!product || !product.trackStock) {
    return Infinity // No stock tracking
  }

  // Get total reserved quantity (not expired, not confirmed)
  const reservations = await prisma.stockReservation.aggregate({
    where: {
      productId,
      confirmed: false,
      expiresAt: { gt: new Date() }
    },
    _sum: { quantity: true }
  })

  const reservedQuantity = reservations._sum.quantity || 0
  return product.stock - reservedQuantity
}

// Check stock availability for all items (considering reservations)
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

    // If stock tracking is enabled
    if (product.trackStock) {
      const availableStock = await getAvailableStock(item.productId)
      if (availableStock < item.quantity) {
        unavailableItems.push({
          name: product.name,
          requested: item.quantity,
          available: Math.max(0, availableStock)
        })
      }
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
      return { success: false, message: "Your cart is empty" }
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Check stock availability
    const stockCheck = await checkStockAvailability(items)
    if (!stockCheck.available) {
      const itemList = stockCheck.unavailableItems
        .map(item => `${item.name} (available: ${item.available})`)
        .join(", ")
      return {
        success: false,
        message: `Out of stock: ${itemList}`
      }
    }

    // Calculate totals (JPY)
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const customsFee = 0 // EU version: no customs fee
    const { shipping } = calculateShipping(items)
    const tax = 0
    const total = subtotal + customsFee + shipping + tax

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // 在庫予約の期限（30分後）
    const reservationExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // Use transaction to create order AND stock reservations atomically
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create stock reservations for each item (NOT reducing actual stock yet)
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { trackStock: true, stock: true }
        })

        if (product?.trackStock) {
          // Get current reservations for this product
          const existingReservations = await tx.stockReservation.aggregate({
            where: {
              productId: item.productId,
              confirmed: false,
              expiresAt: { gt: new Date() }
            },
            _sum: { quantity: true }
          })
          const reservedQty = existingReservations._sum.quantity || 0
          const availableStock = product.stock - reservedQty

          // Double-check available stock in transaction
          if (availableStock < item.quantity) {
            throw new Error(`Out of stock: ${item.name}`)
          }

          // Create reservation (stock is held but not decremented)
          await tx.stockReservation.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              orderNumber,
              expiresAt: reservationExpiresAt,
              confirmed: false
            }
          })
        }
      }

      // 2. Create the order with reservation expiry
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          email: user.email,
          subtotal,
          customsFee,
          tax,
          shipping,
          total,
          currency: "JPY",
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "wise",
          reservationExpiresAt, // 在庫予約期限
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
        const newAddress = await tx.address.create({
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
            NOT: { id: newAddress.id }
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
      customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() || user.name || user.email,
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
    const errorMessage = error instanceof Error ? error.message : "Failed to create order. Please try again."
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

// Cancel order and release stock reservations
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
      return { success: false, message: "Order not found" }
    }

    if (order.status === "CANCELLED") {
      return { success: false, message: "This order has already been cancelled" }
    }

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return { success: false, message: "Shipped orders cannot be cancelled" }
    }

    // Use transaction to update order status AND handle stock
    await prisma.$transaction(async (tx) => {
      // Check if reservations were confirmed (stock was actually decremented)
      const confirmedReservations = await tx.stockReservation.findMany({
        where: { orderNumber, confirmed: true }
      })

      if (confirmedReservations.length > 0) {
        // Stock was decremented, need to restore it
        for (const reservation of confirmedReservations) {
          await tx.product.update({
            where: { id: reservation.productId },
            data: { stock: { increment: reservation.quantity } }
          })
        }
      }

      // Delete all reservations for this order
      await tx.stockReservation.deleteMany({
        where: { orderNumber }
      })

      // Update order status
      await tx.order.update({
        where: { orderNumber },
        data: {
          status: "CANCELLED",
          paymentStatus: "CANCELLED",
          reservationExpiresAt: null
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
    return { success: false, message: "Failed to cancel order" }
  }
}

// Confirm payment - decrement stock and update status
export async function confirmPayment(orderNumber: string): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    })

    if (!order) {
      return { success: false, message: "Order not found" }
    }

    if (order.status === "CANCELLED") {
      return { success: false, message: "This order has been cancelled" }
    }

    if (order.paymentStatus === "PROCESSING" || order.paymentStatus === "COMPLETED") {
      return { success: false, message: "This order has already been processed" }
    }

    // Check if reservation has expired
    if (order.reservationExpiresAt && new Date() > order.reservationExpiresAt) {
      return { success: false, message: "Stock reservation has expired. Please place a new order." }
    }

    // Use transaction to confirm reservations and decrement stock
    await prisma.$transaction(async (tx) => {
      // 1. Get all reservations for this order
      const reservations = await tx.stockReservation.findMany({
        where: { orderNumber, confirmed: false }
      })

      // 2. Decrement actual stock and mark reservations as confirmed
      for (const reservation of reservations) {
        const product = await tx.product.findUnique({
          where: { id: reservation.productId },
          select: { stock: true, trackStock: true }
        })

        if (product?.trackStock) {
          // Verify stock is still available
          if (product.stock < reservation.quantity) {
            throw new Error("Insufficient stock")
          }

          // Actually decrement the stock now
          await tx.product.update({
            where: { id: reservation.productId },
            data: { stock: { decrement: reservation.quantity } }
          })
        }

        // Mark reservation as confirmed
        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { confirmed: true }
        })
      }

      // 3. Update order payment status to PROCESSING (waiting for admin to verify Wise payment)
      await tx.order.update({
        where: { orderNumber },
        data: {
          paymentStatus: "PROCESSING",
          reservationExpiresAt: null // Clear expiry since payment is confirmed
        }
      })
    })

    revalidatePath("/account/orders")
    revalidatePath("/admin/orders")
    revalidatePath("/products")
    revalidatePath("/admin/products")

    return { success: true }
  } catch (error) {
    console.error("Failed to confirm payment:", error)
    const errorMessage = error instanceof Error ? error.message : "Payment confirmation failed"
    return { success: false, message: errorMessage }
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
