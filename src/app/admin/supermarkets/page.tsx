
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

export default function SupermarketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSupermarketName, setNewSupermarketName] = useState("")
  const [loading, setLoading] = useState(true)
  const [showActivationModal, setShowActivationModal] = useState(false)
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null)
  const [activationEmail, setActivationEmail] = useState("")
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "SUPER_ADMIN") {
      router.push("/login")
      return
    }
    fetchSupermarkets()
  }, [session, status, router])

  const fetchSupermarkets = async () => {
    try {
      const response = await fetch("/api/admin/supermarkets")
      const data = await response.json()
      setSupermarkets(data)
    } catch (error) {
      console.error("Error fetching supermarkets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSupermarket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/supermarkets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newSupermarketName })
      })

      if (response.ok) {
        setNewSupermarketName("")
        setShowAddForm(false)
        fetchSupermarkets()
      }
    } catch (error) {
      console.error("Error adding supermarket:", error)
    }
  }

  const toggleSupermarketStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
      const response = await fetch(`/api/admin/supermarkets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchSupermarkets()
      }
    } catch (error) {
      console.error("Error updating supermarket:", error)
    }
  }

  const handleActivateSupermarket = (supermarket: Supermarket) => {
    setSelectedSupermarket(supermarket)
    setShowActivationModal(true)
    setActivationEmail("")
    setGeneratedCredentials(null)
  }

  const activateSupermarket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupermarket || !activationEmail.trim()) return

    try {
      const response = await fetch(`/api/admin/supermarkets/${selectedSupermarket.id}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: activationEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedCredentials(data.credentials)
        fetchSupermarkets()
      } else {
        alert(data.error || "Failed to activate supermarket")
      }
    } catch (error) {
      console.error("Error activating supermarket:", error)
      alert("Failed to activate supermarket")
    }
  }

  const closeActivationModal = () => {
    setShowActivationModal(false)
    setSelectedSupermarket(null)
    setActivationEmail("")
    setGeneratedCredentials(null)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supermarkets Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Supermarket Directly
          </button>
        </div>
      </div>

      {/* Pending Supermarkets Alert */}
      {supermarkets.filter(s => s.status === "PENDING").length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                {supermarkets.filter(s => s.status === "PENDING").length} Supermarket(s) Pending Approval
              </h3>
              <p className="text-yellow-700 text-sm">
                Distributors have added new supermarkets that need your approval to start ordering.
              </p>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Supermarket</h2>
          <form onSubmit={handleAddSupermarket}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Supermarket Name
              </label>
              <input
                type="text"
                value={newSupermarketName}
                onChange={(e) => setNewSupermarketName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Add Supermarket
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {supermarkets.map((supermarket) => (
              <tr key={supermarket.id}>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {supermarket.status === "PENDING" ? (
                    <button
                      onClick={() => handleActivateSupermarket(supermarket)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Create Login
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleSupermarketStatus(supermarket.id, supermarket.status)}
                      className={`${
                        supermarket.status === "ACTIVE"
                          ? "text-red-600 hover:text-red-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                    >
                      {supermarket.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activation Modal */}
      {showActivationModal && selectedSupermarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Activate {selectedSupermarket.name}
            </h2>
            
            {!generatedCredentials ? (
              <form onSubmit={activateSupermarket}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Email Address for Login *
                  </label>
                  <input
                    type="email"
                    value={activationEmail}
                    onChange={(e) => setActivationEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="manager@supermarket.com"
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    This will be their login email. A secure password will be generated automatically.
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Create Login & Activate
                  </button>
                  <button
                    type="button"
                    onClick={closeActivationModal}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    ✅ Supermarket Activated Successfully!
                  </h3>
                  <p className="text-green-700 text-sm mb-3">
                    Login credentials have been created. Please share these with the supermarket:
                  </p>
                  
                  <div className="bg-white rounded border p-3 font-mono text-sm">
                    <div className="mb-2">
                      <strong>Email:</strong> {generatedCredentials.email}
                    </div>
                    <div>
                      <strong>Password:</strong> {generatedCredentials.password}
                    </div>
                  </div>
                  
                  <p className="text-green-600 text-xs mt-2">
                    💡 Save these credentials and share them with the supermarket via email, phone, or in-person.
                  </p>
                </div>
                
                <button
                  onClick={closeActivationModal}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
