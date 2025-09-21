import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

/**
 * Generate a unique email address for a supermarket
 * Format: {clean-supermarket-name}-{uuid}@{domain}
 */
export function generateSupermarketEmail(
  supermarketName: string, 
  domain: string = 'smokeapp.com'
): string {
  const uuid = randomUUID().split('-')[0] // Use first part of UUID for readability
  const cleanName = supermarketName
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, '')     // Remove special characters
    .substring(0, 20)               // Limit length
  
  return `${cleanName}-${uuid}@${domain}`
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}

/**
 * Check if an email address already exists in the database
 */
export async function isEmailUnique(email: string): Promise<boolean> {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })
  
  return !existingUser
}

/**
 * Generate a unique email address (retry if collision occurs)
 */
export async function generateUniqueEmail(
  supermarketName: string,
  domain: string = 'smokeapp.com',
  maxRetries: number = 5
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const email = generateSupermarketEmail(supermarketName, domain)
    const isUnique = await isEmailUnique(email)
    
    if (isUnique) {
      return email
    }
    
    // If not unique, try again (UUID will be different)
    console.log(`Email collision detected: ${email}, retrying...`)
  }
  
  throw new Error(`Failed to generate unique email after ${maxRetries} attempts`)
}

