"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  // Snapshot data - preserved even if product is deleted
  productName: string
  productDescription?: string
  productImage?: string
  distributorId: string
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  items: OrderItem[]
}

function OrdersPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "SUPERMARKET") {
      router.push("/login")
      return
    }
    fetchOrders()

    // Show success message if redirected from checkout
    if (searchParams.get("success") === "true") {
      alert("Order placed successfully!")
    }
  }, [session, status, router, searchParams])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/supermarket/orders")
      const data = await response.json()
      
      // Handle deactivation error
      if (response.status === 403 && data.code === "ACCOUNT_DEACTIVATED") {
        alert(data.message || "Your account has been deactivated. You will be logged out.")
        // Redirect to login with deactivation message
        window.location.href = "/login?error=account_deactivated"
        return
      }
      
      // Handle other errors
      if (!response.ok || data.error) {
        console.error("API Error:", data.error || "Failed to fetch orders")
        setOrders([]) // Set empty array instead of error object
        return
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setOrders(data)
      } else {
        console.error("Invalid data format - expected array, got:", typeof data)
        setOrders([])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      setOrders([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "SHIPPED":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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
            <div className="flex items-center">
              <button
                onClick={() => router.push("/products")}
                className="mr-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
                <p className="text-sm text-gray-600">{orders.length} orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/cart")}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l1.5 6m9.5-6v6a1 1 0 01-1 1H9a1 1 0 01-1-1v-6m8 0V9a1 1 0 00-1-1H8a1 1 0 00-1 1v4.01" />
                </svg>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="bg-white border-b px-4 py-2">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => router.push("/products")}
            className="flex-shrink-0 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            🛒 Products
          </button>
          <button
            onClick={() => router.push("/account")}
            className="flex-shrink-0 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
          >
            👤 Account
          </button>
        </div>
      </nav>

      <div className="px-4 py-4">

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6">Your order history will appear here</p>
            <button
              onClick={() => router.push("/products")}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer transition-all ${
                  selectedOrder?.id === order.id ? "ring-2 ring-blue-500 border-blue-200" : ""
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Order Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Order #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <p className="text-xl font-bold text-green-600 mt-1">${order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <span className="text-gray-700 font-medium">{order.items.length} items</span>
                    <button className="text-blue-600 font-semibold text-sm">
                      {selectedOrder?.id === order.id ? 'Hide Details' : 'View Details'} →
                    </button>
                  </div>
                </div>
                
                {/* Order Details (Expanded) */}
                {selectedOrder?.id === order.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-4 space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                              {item.productDescription && (
                                <p className="text-sm text-gray-600 mt-1">{item.productDescription}</p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold">{item.quantity}x ${item.price.toFixed(2)}</p>
                              <p className="text-sm text-gray-600">${(item.quantity * item.price).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading orders...</div>}>
      <OrdersPageContent />
    </Suspense>
  )
}
