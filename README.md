# Smoke Purchasing Platform

A web platform for managing smoke purchases with three roles: Super Admin, Distributor, and Supermarket.

## Features

### Super Admin (Platform Owner)
- Add new supermarkets after offline payment ($70 one-time)
- Remove/deactivate supermarkets
- Manage platform access

### Distributor
- Add/edit/delete smoke products
- Manage incoming orders from supermarkets
- Update order status (Pending → Shipped → Completed)

### Supermarket (Customer)
- Browse distributor catalog
- Add items to cart and place orders
- Track their own orders

## Tech Stack

- **Frontend & Backend:** Next.js 14 (App Router)
- **Database:** MySQL (configurable to PostgreSQL)
- **ORM:** Prisma
- **Auth:** NextAuth.js (role-based authentication)
- **Styling:** Tailwind CSS

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd smoke-app
npm install
```

### 2. Database Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/smoke_app"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Migration and Seeding

```bash
# Create and apply migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed the database with sample data
npx prisma db seed
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000`

## Default Login Credentials

After seeding the database, you can use these credentials:

- **Super Admin:** admin@smokeapp.com / admin123
- **Distributor:** distributor@smokeapp.com / distributor123  
- **Supermarket:** supermarket@smokeapp.com / supermarket123

## Database Schema

The application uses the following main models:

- **User:** Authentication and role management
- **Supermarket:** Customer organizations
- **Product:** Items managed by distributors
- **Order:** Purchase orders from supermarkets
- **OrderItem:** Individual items within orders

## Routes

- `/` - Home (redirects based on role)
- `/login` - Login page (all roles)
- `/admin/supermarkets` - Manage supermarkets (Super Admin only)
- `/distributor/products` - CRUD products (Distributor only)
- `/distributor/orders` - Manage orders (Distributor only)
- `/products` - Browse products (Supermarket only)
- `/cart` - Checkout & place order (Supermarket only)
- `/orders` - Order history (Supermarket only)

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Database Hosting Options

- **PlanetScale** (MySQL)
- **Railway** (MySQL/PostgreSQL)
- **Supabase** (PostgreSQL)
- **AWS RDS**

## Environment Variables

Required environment variables:

```env
DATABASE_URL="your-database-connection-string"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000" # or your production URL
```

## Development

### Adding New Features

1. Update Prisma schema if needed (`prisma/schema.prisma`)
2. Run `npx prisma migrate dev` to apply changes
3. Update API routes in `src/app/api/`
4. Update frontend components in `src/app/`

### Database Management

```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## Security Notes

- Change default passwords in production
- Use strong `NEXTAUTH_SECRET` in production
- Implement proper input validation
- Add rate limiting for API routes
- Use HTTPS in production

## License

MIT License