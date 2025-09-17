import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@smokeapp.com' },
    update: {},
    create: {
      email: 'admin@smokeapp.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN'
    }
  })

  console.log('Created Super Admin:', superAdmin.email)

  // Create Distributor
  const distributorPassword = await bcrypt.hash('distributor123', 10)
  
  const distributor = await prisma.user.upsert({
    where: { email: 'distributor@smokeapp.com' },
    update: {},
    create: {
      email: 'distributor@smokeapp.com',
      password: distributorPassword,
      role: 'DISTRIBUTOR'
    }
  })

  console.log('Created Distributor:', distributor.email)

  // Create Sample Supermarket
  const supermarket = await prisma.supermarket.upsert({
    where: { id: 'sample-supermarket-id' },
    update: {},
    create: {
      id: 'sample-supermarket-id',
      name: 'Sample Supermarket',
      status: 'ACTIVE'
    }
  })

  // Create Supermarket User
  const supermarketPassword = await bcrypt.hash('supermarket123', 10)
  
  const supermarketUser = await prisma.user.upsert({
    where: { email: 'supermarket@smokeapp.com' },
    update: {},
    create: {
      email: 'supermarket@smokeapp.com',
      password: supermarketPassword,
      role: 'SUPERMARKET',
      supermarketId: supermarket.id
    }
  })

  console.log('Created Supermarket:', supermarket.name)
  console.log('Created Supermarket User:', supermarketUser.email)

  // Create Sample Products
  const products = [
    {
      name: 'Premium Cigarettes Pack',
      price: 12.50,
      stock: 100,
      description: 'High quality premium cigarettes',
      distributorId: distributor.id
    },
    {
      name: 'Classic Cigarettes Pack',
      price: 8.75,
      stock: 150,
      description: 'Classic cigarettes for everyday use',
      distributorId: distributor.id
    },
    {
      name: 'Light Cigarettes Pack',
      price: 9.25,
      stock: 80,
      description: 'Light cigarettes with reduced tar',
      distributorId: distributor.id
    },
    {
      name: 'Menthol Cigarettes Pack',
      price: 10.00,
      stock: 120,
      description: 'Refreshing menthol cigarettes',
      distributorId: distributor.id
    }
  ]

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { 
        id: `${productData.name.toLowerCase().replace(/\s+/g, '-')}-${distributor.id}` 
      },
      update: {},
      create: {
        ...productData,
        id: `${productData.name.toLowerCase().replace(/\s+/g, '-')}-${distributor.id}`
      }
    })
    console.log('Created Product:', product.name)
  }

  console.log('Database seeded successfully!')
  console.log('\n--- Login Credentials ---')
  console.log('Super Admin: admin@smokeapp.com / admin123')
  console.log('Distributor: distributor@smokeapp.com / distributor123')
  console.log('Supermarket: supermarket@smokeapp.com / supermarket123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
