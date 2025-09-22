import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }
    
    console.log('🔍 Verifying credentials for:', email);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { supermarket: true }
    })
    
    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json({ 
        success: false,
        error: "User not found",
        email: email
      })
    }
    
    console.log('✅ User found:', user.email, user.role);
    console.log('🏪 Supermarket:', user.supermarket?.name, user.supermarket?.status);
    
    // Test password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('🔐 Password valid:', isPasswordValid);
    
    return NextResponse.json({
      success: true,
      userFound: true,
      passwordValid: isPasswordValid,
      userInfo: {
        email: user.email,
        role: user.role,
        supermarketName: user.supermarket?.name,
        supermarketStatus: user.supermarket?.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      canLogin: isPasswordValid && user.supermarket?.status === 'ACTIVE',
      issues: [
        ...(isPasswordValid ? [] : ['Password does not match']),
        ...(user.supermarket?.status !== 'ACTIVE' ? [`Supermarket status is ${user.supermarket?.status}`] : [])
      ]
    })
    
  } catch (error) {
    console.error("Credential verification error:", error)
    return NextResponse.json({ 
      success: false,
      error: "Verification failed", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}




