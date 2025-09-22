import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { generateSecurePassword } from "@/lib/email-utils"

export async function GET() {
  try {
    console.log('🧪 Testing password generation and hashing...');
    
    // Test 1: Generate password
    const password = generateSecurePassword(12)
    console.log('🔐 Generated password:', password, 'Length:', password.length);
    
    // Test 2: Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('🔒 Hashed password length:', hashedPassword.length);
    
    // Test 3: Verify password
    const isValid = await bcrypt.compare(password, hashedPassword)
    console.log('✅ Password verification:', isValid);
    
    // Test 4: Try with wrong password
    const wrongPassword = await bcrypt.compare("wrongpassword", hashedPassword)
    console.log('❌ Wrong password verification:', wrongPassword);
    
    return NextResponse.json({
      test: "Password generation and verification test",
      results: {
        passwordGenerated: !!password,
        passwordLength: password.length,
        hashedLength: hashedPassword.length,
        verificationPassed: isValid,
        wrongPasswordRejected: !wrongPassword
      },
      sampleCredentials: {
        email: "test@example.com",
        password: password,
        note: "These are test credentials - not for actual login"
      },
      allTestsPassed: isValid && !wrongPassword,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Password test error:", error)
    return NextResponse.json({
      error: "Password test failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}




