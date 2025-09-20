import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Session } from "next-auth"

/**
 * Validates supermarket session and checks if supermarket is still active
 * Returns the session if valid, or an error response if invalid
 */
export async function validateSupermarketSession(): Promise<
  | { isValid: false; response: NextResponse }
  | { isValid: true; session: Session }
> {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== "SUPERMARKET") {
    return {
      isValid: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Check if supermarket is still active
  if (session.user.supermarketId) {
    try {
      const supermarket = await prisma.supermarket.findUnique({
        where: { id: session.user.supermarketId },
        select: { status: true, name: true }
      })

      if (!supermarket || supermarket.status !== "ACTIVE") {
        return {
          isValid: false,
          response: NextResponse.json({ 
            error: "Account deactivated", 
            message: "Your supermarket account has been deactivated by the administrator. Please contact support.",
            code: "ACCOUNT_DEACTIVATED"
          }, { status: 403 })
        }
      }
    } catch (error) {
      console.error("Error checking supermarket status:", error)
      return {
        isValid: false,
        response: NextResponse.json({ error: "Internal server error" }, { status: 500 })
      }
    }
  }

  return {
    isValid: true,
    session
  }
}
