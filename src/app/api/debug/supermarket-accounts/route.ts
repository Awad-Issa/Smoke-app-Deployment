import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get all supermarket users and their associated supermarkets
    const supermarketUsers = await prisma.user.findMany({
      where: { role: 'SUPERMARKET' },
      select: {
        id: true,
        email: true,
        role: true,
        supermarketId: true,
        createdAt: true,
        updatedAt: true,
        supermarket: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get all supermarkets
    const allSupermarkets = await prisma.supermarket.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      summary: {
        totalSupermarketUsers: supermarketUsers.length,
        totalSupermarkets: allSupermarkets.length,
        activeSupermarkets: allSupermarkets.filter(s => s.status === 'ACTIVE').length,
        pendingSupermarkets: allSupermarkets.filter(s => s.status === 'PENDING').length,
        inactiveSupermarkets: allSupermarkets.filter(s => s.status === 'INACTIVE').length
      },
      loginCredentials: supermarketUsers.map(user => ({
        email: user.email,
        supermarketName: user.supermarket?.name || '❌ NO SUPERMARKET LINKED',
        supermarketStatus: user.supermarket?.status || 'NONE',
        canLogin: user.supermarket?.status === 'ACTIVE',
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt,
        supermarketId: user.supermarketId
      })),
      supermarkets: allSupermarkets.map(market => ({
        name: market.name,
        status: market.status,
        hasUserAccount: market._count.users > 0,
        userCount: market._count.users,
        orderCount: market._count.orders,
        created: market.createdAt,
        updated: market.updatedAt
      })),
      detailedData: {
        users: supermarketUsers,
        supermarkets: allSupermarkets
      },
      timestamp: new Date().toISOString(),
      note: "Use this to debug login issues - check if the email you're trying matches any in 'loginCredentials'"
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}







