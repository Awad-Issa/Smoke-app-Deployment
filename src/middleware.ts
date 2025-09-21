import { withAuth } from "next-auth/middleware"
import { prisma } from "@/lib/prisma"

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Super Admin routes
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "SUPER_ADMIN") {
        return Response.redirect(new URL("/login", req.url))
      }
    }

    // Distributor routes (includes /distributor/supermarkets for read-only access)
    if (pathname.startsWith("/distributor")) {
      if (token?.role !== "DISTRIBUTOR") {
        return Response.redirect(new URL("/login", req.url))
      }
    }

    // Supermarket routes - check if supermarket is still active
    if (pathname.startsWith("/products") || pathname.startsWith("/cart") || pathname.startsWith("/orders") || pathname.startsWith("/account")) {
      if (token?.role !== "SUPERMARKET") {
        return Response.redirect(new URL("/login", req.url))
      }

      // Additional check: ensure supermarket is still active (only if we have a supermarketId)
      if (token?.supermarketId) {
        try {
          const supermarket = await prisma.supermarket.findUnique({
            where: { id: token.supermarketId },
            select: { status: true }
          })

          if (!supermarket || supermarket.status !== "ACTIVE") {
            // Supermarket has been deactivated - redirect to login with message
            const loginUrl = new URL("/login", req.url)
            loginUrl.searchParams.set("error", "account_deactivated")
            return Response.redirect(loginUrl)
          }
        } catch (error) {
          console.error("Error checking supermarket status in middleware:", error)
          // Don't redirect on database errors during middleware - let the request continue
          // The API endpoints will handle the validation
        }
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    "/admin/:path*",
    "/distributor/:path*",
    "/products/:path*",
    "/cart/:path*",
    "/orders/:path*",
    "/account/:path*"
  ]
}
