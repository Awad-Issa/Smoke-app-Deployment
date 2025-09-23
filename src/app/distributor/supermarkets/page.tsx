"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Supermarket {
  id: string
  name: string
  status: string
  createdAt: string
  _count: {
    users: number
    orders: number
  }
}

export default function DistributorSupermarketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DISTRIBUTOR") {
      router.push("/login")
      return
    }
    fetchSupermarkets()
  }, [session, status, router])

  const fetchSupermarkets = async () => {
    try {
      const response = await fetch("/api/distributor/supermarkets")
      const data = await response.json()
      
      // Handle errors
      if (!response.ok || data.error) {
        console.error("API Error:", data.error || "Failed to fetch supermarkets")
        setSupermarkets([]) // Set empty array instead of error object
        return
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSupermarkets(data)
      } else {
        console.error("Invalid data format - expected array, got:", typeof data)
        setSupermarkets([])
      }
    } catch (error) {
      console.error("Error fetching supermarkets:", error)
      setSupermarkets([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Supermarkets</h1>
              <p className="text-sm text-gray-600">{supermarkets.length} registered</p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="bg-white border-b">
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => router.push("/distributor/products")}
              className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-all"
            >
              📦 Products
            </button>
            <button
              onClick={() => router.push("/distributor/orders")}
              className="flex-shrink-0 bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition-all"
            >
              📋 Orders
            </button>
            <button
              onClick={() => router.push("/distributor/add-supermarket")}
              className="flex-shrink-0 bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-orange-600 transition-all"
            >
              ➕ Add Supermarket
            </button>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4">

        {/* Mobile Statistics Cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {supermarkets.length}
              </div>
              <div className="text-sm text-gray-600">🏪 Total</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {supermarkets.filter(s => s.status === "ACTIVE").length}
              </div>
              <div className="text-sm text-gray-600">✅ Active</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {supermarkets.filter(s => s.status === "PENDING").length}
              </div>
              <div className="text-sm text-gray-600">⏳ Pending</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {supermarkets.reduce((total, s) => total + s._count.orders, 0)}
              </div>
              <div className="text-sm text-gray-600">📋 Orders</div>
            </div>
          </div>
        </div>

        {supermarkets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No supermarkets yet</h3>
            <p className="text-gray-500 mb-6">Supermarkets will appear here when they register</p>
          </div>
        ) : (
          <div className="space-y-4">
            {supermarkets.map((supermarket) => (
              <div
                key={supermarket.id}
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-xl ${
                  supermarket.status === "INACTIVE" ? "opacity-60" : ""
                }`}
                onClick={() => router.push(`/distributor/supermarkets/${supermarket.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">🏪 {supermarket.name}</h3>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">
                      Joined {new Date(supermarket.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        supermarket.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : supermarket.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {supermarket.status === "ACTIVE" ? "✅ Active" : 
                       supermarket.status === "PENDING" ? "⏳ Pending" : 
                       "❌ Inactive"}
                    </span>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-xl p-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{supermarket._count.users}</div>
                    <div className="text-xs text-gray-600">👥 Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{supermarket._count.orders}</div>
                    <div className="text-xs text-gray-600">📋 Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      {supermarket.status === "ACTIVE" ? 
                        (supermarket._count.orders > 0 ? "🔥" : "🆕") : 
                        supermarket.status === "PENDING" ? "⏳" : "💤"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {supermarket.status === "ACTIVE" ? 
                        (supermarket._count.orders > 0 ? "Active" : "New") : 
                        supermarket.status === "PENDING" ? "Pending" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Business Insight</h3>
          <p className="text-blue-700 text-sm">
            This directory shows all supermarkets on the platform. Active supermarkets can browse and order your products. 
            Focus on creating attractive products to increase orders from these potential customers.
          </p>
        </div>
      </div>
    </div>
  )
}
