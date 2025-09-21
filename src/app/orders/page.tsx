"use client"

import { useState, useEffect } from "react"
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

export default function OrdersPage() {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            📋 {session?.user?.email}
          </span>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/account")}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            👤 My Account
          </button>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🛒 Continue Shopping
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No orders found</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Your Orders</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedOrder?.id === order.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        Order #{order.id.slice(-8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <p className="text-sm font-medium mt-1">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Order Details</h2>
            </div>
            {selectedOrder ? (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">
                    Order #{selectedOrder.id.slice(-8)}
                  </h3>
                  <p className="text-gray-600">
                    Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-gray-600">
                    Status: 
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium mb-3">Items Ordered</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.productName || `Product ${item.productId} (Deleted)`}</p>
                          <p className="text-sm text-gray-600">
                            ${item.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-medium">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Order Status</h4>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.status === "PENDING" && (
                      <p className="text-yellow-600">
                        ⏳ Your order is being processed by the distributor
                      </p>
                    )}
                    {selectedOrder.status === "SHIPPED" && (
                      <p className="text-blue-600">
                        🚚 Your order has been shipped and is on the way
                      </p>
                    )}
                    {selectedOrder.status === "COMPLETED" && (
                      <p className="text-green-600">
                        ✅ Your order has been completed and delivered
                      </p>
                    )}
                    {selectedOrder.status === "CANCELLED" && (
                      <p className="text-red-600">
                        ❌ Your order has been cancelled
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Select an order to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
