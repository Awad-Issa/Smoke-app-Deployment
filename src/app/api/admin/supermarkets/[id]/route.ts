import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await request.json()
    const { id } = params

    if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 })
    }

    const supermarket = await prisma.supermarket.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(supermarket)
  } catch (error) {
    console.error("Error updating supermarket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
