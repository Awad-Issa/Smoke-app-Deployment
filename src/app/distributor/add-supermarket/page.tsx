"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AddSupermarketPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    supermarketName: "",
    contactPhone: "",
    address: ""
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "DISTRIBUTOR") {
      router.push("/login")
      return
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/distributor/add-supermarket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add supermarket")
      }
    } catch (error) {
      console.error("Error adding supermarket:", error)
      alert("Failed to add supermarket")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Supermarket Added Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            The supermarket has been added to the platform with PENDING status. 
            The admin will review and activate it soon.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setSubmitted(false)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Add Another Supermarket
            </button>
            <button
              onClick={() => router.push("/distributor/supermarkets")}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              View All Supermarkets
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Add New Supermarket</h1>
          <button
            onClick={() => router.push("/distributor/supermarkets")}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Supermarkets
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Supermarket Information</h2>
            <p className="text-gray-600 text-sm">
              Add a new supermarket to the platform. It will be pending until admin approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Supermarket Name *
              </label>
              <input
                type="text"
                value={formData.supermarketName}
                onChange={(e) => setFormData({...formData, supermarketName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
                placeholder="Enter supermarket name"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="059-123-4567"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Business Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                rows={3}
                placeholder="Full business address..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Process</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Supermarket will be added with PENDING status</li>
                <li>• Admin will review and activate the supermarket</li>
                <li>• Login credentials will be generated automatically</li>
                <li>• Supermarket can start ordering once activated</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Adding Supermarket..." : "Add Supermarket"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/distributor/supermarkets")}
                className="bg-gray-500 text-white py-3 px-6 rounded font-medium hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
