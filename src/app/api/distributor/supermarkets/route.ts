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

    // Distributors can view all supermarkets (read-only access)
    const supermarkets = await prisma.supermarket.findMany({
      include: {
        _count: {
          select: {
            users: true,
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(supermarkets)
  } catch (error) {
    console.error("Error fetching supermarkets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

