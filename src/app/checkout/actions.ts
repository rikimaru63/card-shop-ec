"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { sendInvoiceEmail } from "@/lib/email"
import { CUSTOMS_RATE } from "@/lib/constants"
import { businessConfig } from "@/lib/config/business"

type ProductType = 'SINGLE' | 'BOX' | 'OTHER'

type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  productType?: ProductType
}

// DB上のデフォルトと一致させる（prisma: @default(SINGLE)）
const getEffectiveType = (item: CartItem): ProductType =>
  item.productType ?? 'SINGLE'

// Calculate shipping based on product types
function calculateShipping(items: CartItem[]): { shipping: number; singleBoxTotal: number } {
  // シングルカードとBOXの合計金額を計算
  const singleBoxTotal = items
    .filter(item => { const t = getEffectiveType(item); return t === 'SINGLE' || t === 'BOX' })
    .reduce((total, item) => total + item.price * item.quantity, 0)

  // シングル + BOX の合計が¥50,000以上、またはシングル/BOXが含まれない場合は送料無料
  const hasSingleOrBox = items.some(item => { const t = getEffectiveType(item); return t === 'SINGLE' || t === 'BOX' })
  const isFreeShipping = singleBoxTotal >= businessConfig.shipping.freeThreshold || !hasSingleOrBox
  const shipping = isFreeShipping ? 0 : businessConfig.shipping.baseCost

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

// Get available stock (stock は createOrder 時点で即時減算されるため、DB値がそのまま利用可能在庫)
async function getAvailableStock(productId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, trackStock: true }
  })

  if (!product || !product.trackStock) {
    return Infinity // No stock tracking
  }

  return product.stock
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

    // BOX最低5個バリデーション
    const boxItemCount = items
      .filter(item => getEffectiveType(item) === 'BOX')
      .reduce((total, item) => total + item.quantity, 0)

    if (boxItemCount > 0 && boxItemCount < businessConfig.box.minimumQuantity) {
      return {
        success: false,
        message: `BOX products require a minimum order of ${businessConfig.box.minimumQuantity}. Current: ${boxItemCount}`
      }
    }

    // Calculate totals (JPY)
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const customsFee = Math.floor(subtotal * CUSTOMS_RATE)
    const { shipping } = calculateShipping(items)
    const tax = 0
    const total = subtotal + customsFee + shipping + tax

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // 在庫予約の期限
    const reservationExpiresAt = new Date(Date.now() + businessConfig.reservation.expiryMinutes * 60 * 1000)

    // Use transaction to create order AND stock reservations atomically
    const order = await prisma.$transaction(async (tx) => {
      // 1. 在庫予約を確定済みで作成し、実在庫を即時減算する
      //    レースコンディション対策として、条件付きupdateManyでDB側でatomicに
      //    「十分な在庫があるときだけ減算」する。updated.count===0 なら在庫不足。
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { trackStock: true }
        })

        if (product?.trackStock) {
          // 条件付きatomic減算: stock >= quantity のときだけ decrement
          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity }
            },
            data: { stock: { decrement: item.quantity } }
          })

          if (updated.count === 0) {
            // 同時注文により在庫が奪われた or 在庫不足
            throw new Error(`Out of stock: ${item.name}`)
          }

          // 在庫予約を"確定済"で作成（QR時点で減算したことを記録）
          await tx.stockReservation.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              orderNumber,
              expiresAt: reservationExpiresAt,
              confirmed: true
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
