import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateSupermarketSession } from "@/lib/supermarket-auth"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface OrderItem {
  productId: string
  quantity: number
  price: number
  product: {
    name: string
    description: string | null
    image: string | null
    distributorId: string
  }
}

export async function GET() {
  try {
    const validation = await validateSupermarketSession()
    if (!validation.isValid) {
      return validation.response
    }
    
    const session = validation.session

    const orders = await prisma.order.findMany({
      where: {
        supermarketId: session.user.supermarketId!
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Fetch order items using snapshot data (no product join needed)
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await prisma.orderItem.findMany({
          where: { orderId: order.id },
          select: {
            id: true,
            productId: true,
            quantity: true,
            price: true,
            // Use snapshot data for display - preserved even if product is deleted
            productName: true,
            productDescription: true,
            productImage: true,
            distributorId: true
          }
        })
        return {
          ...order,
          items
        }
      })
    )

    return NextResponse.json(ordersWithItems)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPERMARKET") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the supermarket ID from the user record
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { supermarketId: true }
    })

    if (!user?.supermarketId) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 400 })
    }

    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    // Verify all products exist and have sufficient stock
    const productIds = items.map((item: OrderItem) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Some products not found" }, { status: 400 })
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product || product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for product: ${product?.name || 'Unknown'}` 
        }, { status: 400 })
      }
    }

    // Group items by distributor
    const distributorOrders = new Map()
    
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!
      if (!distributorOrders.has(product.distributorId)) {
        distributorOrders.set(product.distributorId, [])
      }
      distributorOrders.get(product.distributorId).push({
        ...item,
        product
      })
    }

    // Create orders for each distributor
    const createdOrders = []

    for (const [distributorId, distributorItems] of distributorOrders) {
      const total = distributorItems.reduce((sum: number, item: OrderItem) => 
        sum + (item.price * item.quantity), 0
      )

      console.log('📦 Creating order for distributor ID:', distributorId, 'from supermarket:', user.supermarketId)

      const order = await prisma.order.create({
        data: {
          supermarketId: user.supermarketId,
          distributorId,
          total,
          items: {
            create: distributorItems.map((item: OrderItem) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              // 📸 PRODUCT SNAPSHOT DATA - preserved forever
              productName: item.product.name,
              productDescription: item.product.description,
              productImage: item.product.image,
              distributorId: item.product.distributorId
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      })

      // Update product stock
      for (const item of distributorItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      createdOrders.push(order)
    }

    return NextResponse.json(createdOrders, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
