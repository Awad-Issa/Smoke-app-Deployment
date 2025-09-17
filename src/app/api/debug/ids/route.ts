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

    // Get distributor user info
    const distributorUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true }
    })

    // Get all products and their distributor IDs
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        distributorId: true
      }
    })

    // Get all orders
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        distributorId: true,
        supermarketId: true,
        total: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      distributorUser,
      products,
      orders,
      sessionUserId: session.user.id
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

