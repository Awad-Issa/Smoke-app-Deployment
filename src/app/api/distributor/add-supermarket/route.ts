import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "DISTRIBUTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      supermarketName, 
      contactPhone, 
      address
    } = await request.json()

    if (!supermarketName) {
      return NextResponse.json({ 
        error: "Supermarket name is required" 
      }, { status: 400 })
    }

    // Check if supermarket name already exists
    const existingSupermarket = await prisma.supermarket.findFirst({
      where: { name: supermarketName }
    })

    if (existingSupermarket) {
      return NextResponse.json({ 
        error: "A supermarket with this name already exists" 
      }, { status: 400 })
    }

    // Create supermarket with PENDING status
    const supermarket = await prisma.supermarket.create({
      data: {
        name: supermarketName,
        phone: contactPhone, // Store the phone number
        status: "PENDING" // Will be activated by admin
      }
    })

    // Store additional contact details (could be expanded to a separate table if needed)
    // For now, just return success - admin will create user accounts when approving

    return NextResponse.json({ 
      message: "Supermarket added successfully and is pending admin approval",
      supermarket: {
        id: supermarket.id,
        name: supermarket.name,
        status: supermarket.status,
        contactPhone,
        address
      },
      note: "Admin will create login credentials when activating this supermarket"
    }, { status: 201 })
  } catch (error) {
    console.error("Error adding supermarket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
