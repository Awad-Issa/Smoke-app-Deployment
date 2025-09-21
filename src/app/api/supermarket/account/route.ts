import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateSupermarketSession } from "@/lib/supermarket-auth"

export async function GET() {
  try {
    const validation = await validateSupermarketSession()
    if (!validation.isValid) {
      return validation.response
    }
    
    const session = validation.session

    // Get the current supermarket user's information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        supermarket: {
          include: {
            orders: {
              orderBy: { createdAt: 'desc' },
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            },
            _count: {
              select: {
                orders: true,
                users: true
              }
            }
          }
        }
      }
    })

    if (!user || !user.supermarket) {
      return NextResponse.json({ error: "User or supermarket not found" }, { status: 404 })
    }

    // Calculate statistics
    const orders = user.supermarket.orders
    const totalValue = orders.reduce((sum, order) => sum + order.total, 0)
    const pendingOrders = orders.filter(order => order.status === 'PENDING').length
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      supermarket: {
        id: user.supermarket.id,
        name: user.supermarket.name,
        status: user.supermarket.status,
        createdAt: user.supermarket.createdAt
      },
      statistics: {
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        totalValue,
        totalUsers: user.supermarket._count.users,
        lastOrderDate: orders.length > 0 ? orders[0].createdAt : null
      },
      recentOrders: orders.slice(0, 5).map(order => ({
        id: order.id,
        status: order.status,
        total: order.total,
        itemCount: order.items.length,
        createdAt: order.createdAt
      }))
    })
  } catch (error) {
    console.error("Error fetching supermarket account info:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
