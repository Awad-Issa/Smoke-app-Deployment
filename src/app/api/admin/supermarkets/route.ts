import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateUniqueEmail, generateSecurePassword } from "@/lib/email-utils"

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

    const { name, phone } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Check if supermarket name already exists
    const existingSupermarket = await prisma.supermarket.findFirst({
      where: { name }
    })

    if (existingSupermarket) {
      return NextResponse.json({ 
        error: "A supermarket with this name already exists" 
      }, { status: 400 })
    }

    // Create supermarket
    const supermarket = await prisma.supermarket.create({
      data: {
        name,
        phone, // Include phone number if provided
        status: "ACTIVE" // Set as active since admin is creating directly
      }
    })

    // Generate unique email and secure password
    const email = await generateUniqueEmail(name)
    const password = generateSecurePassword(12)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user account for the supermarket
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "SUPERMARKET",
        supermarketId: supermarket.id
      }
    })

    return NextResponse.json({
      supermarket,
      credentials: {
        email: user.email,
        password, // Return the plain password for admin to share
      },
      message: "Supermarket created successfully with auto-generated login credentials"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating supermarket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
