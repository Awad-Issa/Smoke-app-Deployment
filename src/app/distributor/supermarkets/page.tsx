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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supermarkets Directory</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.push("/distributor/add-supermarket")}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Add Supermarket
          </button>
          <button
            onClick={() => router.push("/distributor/products")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Manage Products
          </button>
          <button
            onClick={() => router.push("/distributor/orders")}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            View Orders
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {supermarkets.length}
            </div>
            <div className="text-sm text-gray-600">Total Supermarkets</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {supermarkets.filter(s => s.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-gray-600">Active Supermarkets</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {supermarkets.filter(s => s.status === "PENDING").length}
            </div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {supermarkets.reduce((total, s) => total + s._count.orders, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Supermarkets on Platform</h2>
          <p className="text-gray-600 text-sm mt-1">
            View all supermarkets that can purchase your products
          </p>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supermarket Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Potential
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {supermarkets.map((supermarket) => (
              <tr key={supermarket.id} className={supermarket.status === "INACTIVE" ? "opacity-60" : ""}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {supermarket.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      supermarket.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : supermarket.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {supermarket.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supermarket._count.users}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supermarket._count.orders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(supermarket.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {supermarket.status === "ACTIVE" ? (
                    <span className="text-green-600 font-medium">
                      {supermarket._count.orders > 0 ? "Active Customer" : "New Customer"}
                    </span>
                  ) : supermarket.status === "PENDING" ? (
                    <span className="text-yellow-600 font-medium">Awaiting Approval</span>
                  ) : (
                    <span className="text-gray-500">Inactive</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {supermarkets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No supermarkets found on the platform.
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 Business Insight</h3>
        <p className="text-blue-700 text-sm">
          This directory shows all supermarkets on the platform. Active supermarkets can browse and order your products. 
          Focus on creating attractive products to increase orders from these potential customers.
        </p>
      </div>
    </div>
  )
}
