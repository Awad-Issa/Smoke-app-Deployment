# Quick Setup Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Set up Environment Variables
Create `.env.local` file:
```env
DATABASE_URL="mysql://root:password@localhost:3306/smoke_app"
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## 3. Set up Database
```bash
# Create database migration
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed
```

## 4. Run Application
```bash
npm run dev
```

## 5. Login Credentials
- **Super Admin:** admin@smokeapp.com / admin123
- **Distributor:** distributor@smokeapp.com / distributor123  
- **Supermarket:** supermarket@smokeapp.com / supermarket123

## Features Working:
✅ Role-based authentication
✅ Super Admin: Manage supermarkets
✅ Distributor: Manage products and orders
✅ Supermarket: Browse products, add to cart, place orders
✅ Order tracking with status updates
✅ Responsive design with Tailwind CSS

## Database Schema:
- Users with role-based access
- Supermarkets management
- Products catalog
- Orders and order items
- Status tracking (PENDING → SHIPPED → COMPLETED)

The platform is ready for deployment to Vercel with a MySQL database!
