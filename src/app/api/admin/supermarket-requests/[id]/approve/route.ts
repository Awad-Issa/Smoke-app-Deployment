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

    const { notes } = await request.json()
    const { id } = await params

    // Get the request
    const supermarketRequest = await prisma.supermarketRequest.findUnique({
      where: { id }
    })

    if (!supermarketRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (supermarketRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 })
    }

    // Create the supermarket
    const supermarket = await prisma.supermarket.create({
      data: {
        name: supermarketRequest.supermarketName,
        status: "ACTIVE"
      }
    })

    // Generate default password
    const defaultPassword = "welcome123"
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Create supermarket user account
    const user = await prisma.user.create({
      data: {
        email: supermarketRequest.contactEmail,
        password: hashedPassword,
        role: "SUPERMARKET",
        supermarketId: supermarket.id
      }
    })

    // Update request status
    await prisma.supermarketRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        notes,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      }
    })

    return NextResponse.json({ 
      message: "Supermarket approved and created successfully",
      supermarket,
      loginCredentials: {
        email: user.email,
        password: defaultPassword
      }
    })
  } catch (error) {
    console.error("Error approving supermarket request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

