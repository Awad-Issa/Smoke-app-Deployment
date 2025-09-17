import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPERMARKET") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: {
        supermarketId: session.user.supermarketId!
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(orders)
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

    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 })
    }

    // Verify all products exist and have sufficient stock
    const productIds = items.map((item: any) => item.productId)
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
      const total = distributorItems.reduce((sum: number, item: any) => 
        sum + (item.price * item.quantity), 0
      )

      console.log('📦 Creating order for distributor ID:', distributorId, 'from supermarket:', session.user.supermarketId)

      const order = await prisma.order.create({
        data: {
          supermarketId: session.user.supermarketId!,
          distributorId,
          total,
          items: {
            create: distributorItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
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
