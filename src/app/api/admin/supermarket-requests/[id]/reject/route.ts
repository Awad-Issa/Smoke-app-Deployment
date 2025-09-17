import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    if (!notes || !notes.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

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

    // Update request status
    await prisma.supermarketRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        notes,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      }
    })

    return NextResponse.json({ 
      message: "Request rejected successfully"
    })
  } catch (error) {
    console.error("Error rejecting supermarket request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

