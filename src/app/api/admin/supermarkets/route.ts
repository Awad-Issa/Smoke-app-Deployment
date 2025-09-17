import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const supermarket = await prisma.supermarket.create({
      data: {
        name
      }
    })

    return NextResponse.json(supermarket, { status: 201 })
  } catch (error) {
    console.error("Error creating supermarket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
