"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
  }
}

interface Order {
  id: string
  status: string
  total: number
  createdAt: string
  supermarket: {
    id: string
    name: string
  }
  items: OrderItem[]
}

export default function DistributorOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DISTRIBUTOR") {
      router.push("/login")
      return
    }
    fetchOrders()
  }, [session, status, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/distributor/orders")
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/distributor/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchOrders()
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus })
        }
      }
    } catch (error) {
      console.error("Error updating order status:", error)
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
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.push("/distributor/supermarkets")}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            View Supermarkets
          </button>
          <button
            onClick={() => router.push("/distributor/products")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Manage Products
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Orders</h2>
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
                    <p className="font-medium">{order.supermarket.name}</p>
                    <p className="text-sm text-gray-600">
                      Order #{order.id.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
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
            {orders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No orders found.
              </div>
            )}
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
                  Customer: {selectedOrder.supermarket.name}
                </p>
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
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.product.name} x {item.quantity}
                      </span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.status !== "COMPLETED" && selectedOrder.status !== "CANCELLED" && (
                <div className="flex gap-2">
                  {selectedOrder.status === "PENDING" && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, "SHIPPED")}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {selectedOrder.status === "SHIPPED" && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, "COMPLETED")}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Mark as Completed
                    </button>
                  )}
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, "CANCELLED")}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select an order to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
