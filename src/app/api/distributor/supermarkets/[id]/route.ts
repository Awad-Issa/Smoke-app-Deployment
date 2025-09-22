import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DISTRIBUTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: supermarketId } = await params

    // Get supermarket details with user count
    const supermarket = await prisma.supermarket.findUnique({
      where: { id: supermarketId },
      include: {
        _count: {
          select: {
            users: true,
            orders: true
          }
        }
      }
    })

    if (!supermarket) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    // Get orders from this supermarket to the current distributor
    const orders = await prisma.order.findMany({
      where: {
        supermarketId: supermarketId,
        distributorId: session.user.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculate statistics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalItems = orders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentOrders = orders.filter(order => 
      new Date(order.createdAt) >= thirtyDaysAgo
    )

    const response = {
      supermarket,
      orders,
      statistics: {
        totalOrders: orders.length,
        totalRevenue,
        totalItems,
        recentOrders: recentOrders.length,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching supermarket details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
