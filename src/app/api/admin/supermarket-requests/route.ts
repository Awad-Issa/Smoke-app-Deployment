import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await prisma.supermarketRequest.findMany({
      orderBy: {
        requestedAt: "desc"
      }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("Error fetching supermarket requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

