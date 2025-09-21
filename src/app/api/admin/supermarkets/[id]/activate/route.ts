import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { generateUniqueEmail, generateSecurePassword } from "@/lib/email-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the supermarket
    const supermarket = await prisma.supermarket.findUnique({
      where: { id }
    })

    if (!supermarket) {
      return NextResponse.json({ error: "Supermarket not found" }, { status: 404 })
    }

    // Check if supermarket already has a user account
    const existingUser = await prisma.user.findFirst({
      where: { 
        supermarketId: supermarket.id,
        role: "SUPERMARKET" 
      }
    })

    let user;
    let password;

    if (existingUser) {
      // User exists - reset their password
      console.log('🔄 Resetting password for existing user:', existingUser.email);
      password = generateSecurePassword(12)
      console.log('🔐 Generated new password:', password, 'Length:', password.length);
      
      const hashedPassword = await bcrypt.hash(password, 10)
      console.log('🔒 Hashed password length:', hashedPassword.length);

      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      })
      console.log('✅ Password updated for user:', user.email);
      
      // Test the password immediately
      const testPassword = await bcrypt.compare(password, hashedPassword)
      console.log('🧪 Password test result:', testPassword);
      
    } else {
      // No user exists - create new account
      console.log('👤 Creating new user for supermarket:', supermarket.name);
      
      const email = await generateUniqueEmail(supermarket.name)
      console.log('📧 Generated email:', email);
      
      password = generateSecurePassword(12)
      console.log('🔐 Generated password:', password, 'Length:', password.length);
      
      const hashedPassword = await bcrypt.hash(password, 10)
      console.log('🔒 Hashed password length:', hashedPassword.length);

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "SUPERMARKET",
          supermarketId: supermarket.id
        }
      })
      console.log('✅ Created new user:', user.email);
      
      // Test the password immediately
      const testPassword = await bcrypt.compare(password, hashedPassword)
      console.log('🧪 Password test result:', testPassword);
    }

    // Activate the supermarket
    const updatedSupermarket = await prisma.supermarket.update({
      where: { id },
      data: { status: "ACTIVE" }
    })

    const responseData = {
      message: existingUser 
        ? "Password reset successfully" 
        : "Supermarket activated successfully with auto-generated credentials",
      supermarket: updatedSupermarket,
      credentials: {
        email: user.email,
        password
      }
    }
    
    console.log('📤 Returning credentials to frontend:');
    console.log('   📧 Email:', responseData.credentials.email);
    console.log('   🔐 Password:', responseData.credentials.password);
    console.log('   🏪 Supermarket status:', updatedSupermarket.status);
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error activating supermarket:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

