import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { validateSupermarketSession } from "@/lib/supermarket-auth"

export async function POST(request: NextRequest) {
  try {
    const validation = await validateSupermarketSession()
    if (!validation.isValid) {
      return validation.response
    }
    
    const session = validation.session
    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ 
        error: "All password fields are required" 
      }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ 
        error: "New passwords do not match" 
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: "New password must be at least 8 characters long" 
      }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ 
        error: "New password must be different from current password" 
      }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ 
        error: "Current password is incorrect" 
      }, { status: 400 })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    })

    console.log('✅ Password changed successfully for user:', user.email)

    return NextResponse.json({
      message: "Password changed successfully",
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}






