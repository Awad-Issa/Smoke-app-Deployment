import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
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

    // Supermarket routes
    if (pathname.startsWith("/products") || pathname.startsWith("/cart") || pathname.startsWith("/orders")) {
      if (token?.role !== "SUPERMARKET") {
        return Response.redirect(new URL("/login", req.url))
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
    "/orders/:path*"
  ]
}
