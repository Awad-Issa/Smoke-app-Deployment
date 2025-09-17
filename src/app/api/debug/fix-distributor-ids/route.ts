import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DISTRIBUTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('🔧 Fixing distributor IDs for user:', session.user.id)

    // Update all products to use the current distributor's ID
    const updateResult = await prisma.product.updateMany({
      data: {
        distributorId: session.user.id
      }
    })

    console.log('✅ Updated', updateResult.count, 'products with correct distributor ID')

    // Get updated products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        distributorId: true
      }
    })

    return NextResponse.json({
      message: `Updated ${updateResult.count} products`,
      distributorId: session.user.id,
      products
    })
  } catch (error) {
    console.error("Error fixing distributor IDs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

