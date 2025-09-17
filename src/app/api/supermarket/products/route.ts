import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPERMARKET") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all products from all distributors
    const products = await prisma.product.findMany({
      where: {
        stock: {
          gt: 0 // Only show products with stock
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
