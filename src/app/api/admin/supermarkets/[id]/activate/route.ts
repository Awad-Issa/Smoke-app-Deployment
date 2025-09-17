import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email } = await request.json()
    const { id } = await params

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: "A user with this email already exists" 
      }, { status: 400 })
    }

    // Get the supermarket
    const supermarket = await prisma.supermarket.findUnique({
      where: { id }
    })

    if (!supermarket) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    // Generate secure password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user account
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "SUPERMARKET",
        supermarketId: supermarket.id
      }
    })

    // Activate the supermarket
    const updatedSupermarket = await prisma.supermarket.update({
      where: { id },
      data: { status: "ACTIVE" }
    })

    return NextResponse.json({
      message: "Supermarket activated successfully",
      supermarket: updatedSupermarket,
      credentials: {
        email: user.email,
        password: password
      }
    })
  } catch (error) {
    console.error("Error activating supermarket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

