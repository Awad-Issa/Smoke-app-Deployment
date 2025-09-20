import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateSupermarketSession } from "@/lib/supermarket-auth"

export async function GET() {
  try {
    const validation = await validateSupermarketSession()
    if (!validation.isValid) {
      return validation.response
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

    console.log('🛒 Supermarket fetching products, found:', products.length)

    const response = NextResponse.json(products)
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
