import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the supermarket with comprehensive data
    const supermarket = await prisma.supermarket.findUnique({
      where: { id },
      include: {
        users: {
          where: {
            role: "SUPERMARKET"
          },
          select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!supermarket) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    const supermarketUser = supermarket.users[0] // Get the first (should be only) supermarket user

    if (!supermarketUser) {
      return NextResponse.json({ 
        error: "No user account found for this supermarket",
        hasAccount: false
      }, { status: 404 })
    }

    // No order statistics needed for admin view

    return NextResponse.json({
      supermarket: {
        id: supermarket.id,
        name: supermarket.name,
        status: supermarket.status,
        createdAt: supermarket.createdAt
      },
      user: {
        email: supermarketUser.email,
        createdAt: supermarketUser.createdAt,
        lastUpdated: supermarketUser.updatedAt
      },
      hasAccount: true,
      note: "Password cannot be retrieved for security reasons. Use 'Reset Password' if needed."
    })
  } catch (error) {
    console.error("Error fetching supermarket credentials:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
