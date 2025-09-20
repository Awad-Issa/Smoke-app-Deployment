import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DISTRIBUTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔍 Distributor fetching orders for user ID:', session.user.id)

    // Debug: Show all orders in database
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        distributorId: true,
        supermarketId: true,
        total: true,
        createdAt: true
      }
    })
    console.log('📊 All orders in database:', allOrders)

    const orders = await prisma.order.findMany({
      where: {
        distributorId: session.user.id
      },
      include: {
        supermarket: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Fetch order items separately to handle deleted products
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await prisma.orderItem.findMany({
          where: { orderId: order.id },
          include: {
            product: {
              select: {
                id: true,
                name: true
              }
            }
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
