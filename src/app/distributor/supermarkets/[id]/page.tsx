"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"

interface SupermarketDetails {
  supermarket: {
    id: string
    name: string
    phone?: string
    status: string
    createdAt: string
    _count: {
      users: number
      orders: number
    }
  }
  orders: Array<{
    id: string
    total: number
    status: string
    createdAt: string
    items: Array<{
      id: string
      quantity: number
      price: number
      productName?: string
      productDescription?: string
      productImage?: string
      product?: {
        name: string
        image?: string
      }
    }>
  }>
  statistics: {
    totalOrders: number
    totalRevenue: number
    totalItems: number
    recentOrders: number
    averageOrderValue: number
  }
}

export default function SupermarketDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [details, setDetails] = useState<SupermarketDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DISTRIBUTOR") {
      router.push("/login")
      return
    }
    if (params.id) {
      fetchSupermarketDetails(params.id as string)
    }
  }, [session, status, router, params.id])

  const fetchSupermarketDetails = async (supermarketId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/distributor/supermarkets/${supermarketId}`)
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "Failed to fetch supermarket details")
        return
      }
      
      setDetails(data)
    } catch (error) {
      console.error("Error fetching supermarket details:", error)
      setError("Failed to load supermarket details")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/distributor/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Refresh the data
        if (params.id) {
          fetchSupermarketDetails(params.id as string)
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.push("/distributor/supermarkets")}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Back to Supermarkets
          </button>
        </div>
      </div>
    )
  }

  if (!details) {
    return <div className="flex justify-center items-center h-screen">No data found</div>
  }

  const { supermarket, orders, statistics } = details

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.push("/distributor/supermarkets")}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            ← Back to Supermarkets
          </button>
          <h1 className="text-3xl font-bold">{supermarket.name}</h1>
          <div className="text-gray-600 space-y-1">
            <p>Supermarket Details & Order History</p>
            {supermarket.phone && (
              <p className="text-sm flex items-center gap-2">
                📞 <span>{supermarket.phone}</span>
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              supermarket.status === "ACTIVE"
                ? "bg-green-100 text-green-800"
                : supermarket.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {supermarket.status}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-blue-600">
            {statistics.totalOrders}
          </div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-green-600">
            ₪{statistics.totalRevenue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-purple-600">
            {statistics.totalItems}
          </div>
          <div className="text-sm text-gray-600">Items Sold</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-orange-600">
            ₪{statistics.averageOrderValue.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Avg Order Value</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl font-bold text-indigo-600">
            {statistics.recentOrders}
          </div>
          <div className="text-sm text-gray-600">Recent Orders (30d)</div>
        </div>
      </div>

      {/* Supermarket Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Supermarket Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{supermarket.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className="mt-1 text-sm text-gray-900">{supermarket.status}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Joined Date</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(supermarket.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Users</label>
            <p className="mt-1 text-sm text-gray-900">{supermarket._count.users}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Orders</label>
            <p className="mt-1 text-sm text-gray-900">{supermarket._count.orders}</p>
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Order History</h2>
          <p className="text-gray-600 text-sm mt-1">
            All orders from {supermarket.name} to your distribution center
          </p>
        </div>
        
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No orders found from this supermarket yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Order #{order.id.slice(-8)}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()} at{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ₪{order.total.toFixed(2)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : order.status === "SHIPPED"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "PROCESSING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                      {order.status === "PENDING" && (
                        <select
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                          defaultValue=""
                        >
                          <option value="" disabled>Update Status</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item) => {
                    const productName = item.productName || item.product?.name || "Unknown Product"
                    const productImage = item.productImage || item.product?.image
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                        {productImage && (
                          <div className="relative w-12 h-12 flex-shrink-0">
                            <Image
                              src={productImage}
                              alt={productName}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <div className="flex-grow">
                          <h4 className="font-medium">{productName}</h4>
                          {item.productDescription && (
                            <p className="text-sm text-gray-600">{item.productDescription}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {item.quantity} × ₪{item.price.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            = ₪{(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
