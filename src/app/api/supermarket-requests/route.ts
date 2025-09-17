import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body: {
      supermarketName: string
      contactEmail: string
      contactPhone?: string
      address?: string
      businessLicense?: string
    } = await request.json()
    
    const { 
      supermarketName, 
      contactEmail, 
      contactPhone, 
      address, 
      businessLicense 
    } = body

    if (!supermarketName || !contactEmail) {
      return NextResponse.json({ 
        error: "Supermarket name and contact email are required" 
      }, { status: 400 })
    }

    // Check if email already exists in requests
    const existingRequest = await prisma.supermarketRequest.findFirst({
      where: {
        contactEmail,
        status: {
          in: ["PENDING", "APPROVED"]
        }
      }
    })

    if (existingRequest) {
      return NextResponse.json({ 
        error: "A request with this email already exists" 
      }, { status: 400 })
    }

    // Check if supermarket name already exists
    const existingSupermarket = await prisma.supermarket.findFirst({
      where: {
        name: supermarketName
      }
    })

    if (existingSupermarket) {
      return NextResponse.json({ 
        error: "A supermarket with this name already exists" 
      }, { status: 400 })
    }

    const supermarketRequest = await prisma.supermarketRequest.create({
      data: {
        supermarketName,
        contactEmail,
        contactPhone,
        address,
        businessLicense
      }
    })

    return NextResponse.json({ 
      message: "Registration request submitted successfully",
      requestId: supermarketRequest.id 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating supermarket request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

