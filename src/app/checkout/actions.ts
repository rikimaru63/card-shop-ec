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
  name: string
  street1: string
  city: string
  state: string
  postalCode: string
  country: string
}

type CreateOrderInput = {
  items: CartItem[]
  email: string
  shippingAddress: ShippingAddress
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CS-${timestamp}-${random}`
}

export async function createOrder(input: CreateOrderInput): Promise<{
  success: boolean
  orderNumber?: string
  message?: string
}> {
  try {
    const { items, email, shippingAddress } = input

    if (!items || items.length === 0) {
      return { success: false, message: "Cart is empty" }
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shipping = subtotal > 100 ? 0 : 15
    const tax = 0 // No tax for international orders
    const total = subtotal + shipping + tax

    // Generate unique order number
    const orderNumber = generateOrderNumber()

    // Create order with items in a transaction
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        email: user.email,
        subtotal,
        tax,
        shipping,
        total,
        currency: "USD",
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

    // Send invoice email
    const emailResult = await sendInvoiceEmail({
      to: user.email,
      orderNumber: order.orderNumber,
      customerName: user.name || user.email,
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal,
      shipping,
      total,
      currency: "USD"
    })

    if (!emailResult.success) {
      console.warn("Failed to send invoice email:", emailResult.error)
      // Don't fail the order if email fails, just log it
    }

    // Revalidate orders page
    revalidatePath("/account/orders")
    revalidatePath("/admin/orders")

    return {
      success: true,
      orderNumber: order.orderNumber
    }
  } catch (error) {
    console.error("Failed to create order:", error)
    return {
      success: false,
      message: "Failed to create order. Please try again."
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
