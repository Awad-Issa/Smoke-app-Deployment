
"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Supermarket {
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

interface SupermarketCredentials {
  supermarket: {
    id: string
    name: string
    phone?: string
    status: string
    createdAt: string
  }
  user: {
    email: string
    createdAt: string
    lastUpdated: string
  }
  hasAccount: boolean
  note: string
}

export default function SupermarketsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSupermarketName, setNewSupermarketName] = useState("")
  const [newSupermarketPhone, setNewSupermarketPhone] = useState("")
  const [loading, setLoading] = useState(true)
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null)
  const [showNewCredentialsModal, setShowNewCredentialsModal] = useState(false)
  const [credentialsModalTitle, setCredentialsModalTitle] = useState("Supermarket Created Successfully!")
  
  // Credentials viewing state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [selectedSupermarketForCredentials, setSelectedSupermarketForCredentials] = useState<Supermarket | null>(null)
  const [credentialsData, setCredentialsData] = useState<SupermarketCredentials | null>(null)
  const [loadingCredentials, setLoadingCredentials] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [newPasswordGenerated, setNewPasswordGenerated] = useState<string | null>(null)
  
  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`)
    }
  }

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

  const handleAddSupermarket = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/supermarkets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: newSupermarketName, phone: newSupermarketPhone })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Show the auto-generated credentials to the admin
        setGeneratedCredentials(data.credentials)
        setCredentialsModalTitle("Supermarket Created Successfully!")
        setNewSupermarketName("")
        setNewSupermarketPhone("")
        setShowAddForm(false)
        setShowNewCredentialsModal(true)
        
        fetchSupermarkets()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create supermarket")
      }
    } catch (error) {
      console.error("Error adding supermarket:", error)
      alert("Failed to create supermarket")
    }
  }

  const toggleSupermarketStatus = async (id: string, currentStatus: string, supermarketName: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    const action = newStatus === "ACTIVE" ? "activate" : "deactivate"
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${supermarketName}"?\n\n` +
      (newStatus === "INACTIVE" 
        ? "⚠️ This will immediately log out their users and prevent them from logging in again!"
        : "✅ This will allow their users to log in again.")
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/supermarkets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${data.message}\n💡 ${data.accountEffect}`)
        fetchSupermarkets()
      } else {
        alert(data.error || "Failed to update supermarket status")
      }
    } catch (error) {
      console.error("Error updating supermarket:", error)
      alert("Failed to update supermarket status")
    }
  }

  const handleActivateSupermarket = async (supermarket: Supermarket) => {
    // Directly activate without showing modal since email is auto-generated
    try {
      const response = await fetch(`/api/admin/supermarkets/${supermarket.id}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      
      console.log('🔍 Frontend received activation response:', data);

      if (response.ok) {
        console.log('✅ Activation successful, credentials received:');
        console.log('   📧 Email:', data.credentials?.email);
        console.log('   🔐 Password:', data.credentials?.password);
        console.log('   📝 Message:', data.message);
        
        // Show credentials in modal
        setGeneratedCredentials(data.credentials)
        setCredentialsModalTitle(data.message.includes("reset") ? "Password Reset Successfully!" : "Account Activated Successfully!")
        setShowNewCredentialsModal(true)
        
        fetchSupermarkets()
      } else {
        console.error('❌ Activation failed:', data);
        alert(data.error || "Failed to activate supermarket")
      }
    } catch (error) {
      console.error("Error activating supermarket:", error)
      alert("Failed to activate supermarket")
    }
  }

  // Function to view supermarket credentials
  const handleViewCredentials = async (supermarket: Supermarket) => {
    setSelectedSupermarketForCredentials(supermarket)
    setShowCredentialsModal(true)
    setLoadingCredentials(true)
    setCredentialsData(null)

    try {
      const response = await fetch(`/api/admin/supermarkets/${supermarket.id}/credentials`)
      const data = await response.json()

      if (response.ok) {
        setCredentialsData(data)
      } else {
        alert(data.error || "Failed to fetch credentials")
        setShowCredentialsModal(false)
      }
    } catch (error) {
      console.error("Error fetching credentials:", error)
      alert("Failed to fetch credentials")
      setShowCredentialsModal(false)
    } finally {
      setLoadingCredentials(false)
    }
  }

  const closeCredentialsModal = () => {
    setShowCredentialsModal(false)
    setSelectedSupermarketForCredentials(null)
    setCredentialsData(null)
    setNewPasswordGenerated(null)
  }

  const closeNewCredentialsModal = () => {
    setShowNewCredentialsModal(false)
    setGeneratedCredentials(null)
  }

  // Reset password function
  const handleResetPassword = async (supermarketId: string) => {
    setResettingPassword(true)
    setNewPasswordGenerated(null)

    try {
      const response = await fetch(`/api/admin/supermarkets/${supermarketId}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      
      console.log('🔍 Frontend received password reset response:', data);

      if (response.ok) {
        console.log('✅ Password reset successful, new credentials:');
        console.log('   📧 Email:', data.credentials?.email);
        console.log('   🔐 New Password:', data.credentials?.password);
        
        setNewPasswordGenerated(data.credentials.password)
        // Auto-copy the new password to clipboard for convenience
        copyToClipboard(data.credentials.password, 'password')
        // Refresh credentials data
        handleViewCredentials(selectedSupermarketForCredentials!)
      } else {
        console.error('❌ Password reset failed:', data);
        alert(data.error || "Failed to reset password")
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      alert("Failed to reset password")
    } finally {
      setResettingPassword(false)
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
              <h1 className="text-xl font-bold text-gray-900">👑 Admin Panel</h1>
              <p className="text-sm text-gray-600">{supermarkets.length} supermarkets</p>
            </div>
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
      </header>

      {/* Mobile Navigation */}
      <nav className="bg-white border-b">
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => router.push("/admin/requests")}
              className="flex-shrink-0 bg-yellow-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-yellow-600 transition-all"
            >
              📋 Requests
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex-shrink-0 bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-all"
            >
              ➕ Add Supermarket
            </button>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4">

        {/* Pending Alert */}
        {supermarkets.filter(s => s.status === "PENDING").length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3 text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 text-lg">
                  {supermarkets.filter(s => s.status === "PENDING").length} Pending Approval
                </h3>
                <p className="text-yellow-700 text-sm">
                  New supermarkets need your approval to start ordering
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/requests")}
                className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-yellow-600 transition-all text-sm"
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">➕ Add New Supermarket</h2>
            <form onSubmit={handleAddSupermarket}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    🏪 Supermarket Name
                  </label>
                  <input
                    type="text"
                    value={newSupermarketName}
                    onChange={(e) => setNewSupermarketName(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supermarket name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2">
                    📞 Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newSupermarketPhone}
                    onChange={(e) => setNewSupermarketPhone(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-600 transition-all"
                >
                  ✅ Add Supermarket
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {supermarkets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No supermarkets yet</h3>
            <p className="text-gray-500 mb-6">Add your first supermarket to get started</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
            >
              ➕ Add First Supermarket
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Tip */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4 mb-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Tap any supermarket</strong> to view login credentials, stats, and manage accounts.
                <br/>
                <span className="text-xs">⚠️ Deactivating prevents user logins.</span>
              </p>
            </div>

            <div className="space-y-4">
              {supermarkets.map((supermarket) => (
                <div
                  key={supermarket.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 cursor-pointer transition-all hover:shadow-xl"
                  onClick={() => handleViewCredentials(supermarket)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-gray-900">🏪 {supermarket.name}</h3>
                        {supermarket._count.users === 0 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            No Account
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        📞 {supermarket.phone || "No phone provided"}
                      </p>
                      <p className="text-sm text-gray-600">
                        📅 Joined {new Date(supermarket.createdAt).toLocaleDateString('en-US', {
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
                         "🚫 Inactive"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-3 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{supermarket._count.users}</div>
                      <div className="text-xs text-gray-600">👥 Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{supermarket._count.orders}</div>
                      <div className="text-xs text-gray-600">📋 Orders</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewCredentials(supermarket);
                      }}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-blue-600 transition-all text-sm"
                    >
                      👁️ View Details
                    </button>
                    {supermarket.status === "PENDING" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateSupermarket(supermarket);
                        }}
                        className="bg-green-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-green-600 transition-all text-sm"
                      >
                        ✅ Activate
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSupermarketStatus(supermarket.id, supermarket.status, supermarket.name);
                        }}
                        className={`py-2 px-4 rounded-xl font-semibold transition-all text-sm ${
                          supermarket.status === "ACTIVE"
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {supermarket.status === "ACTIVE" ? "🚫 Deactivate" : "✅ Activate"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      {/* Credentials Viewing Modal */}
      {showCredentialsModal && selectedSupermarketForCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 pr-4">
                📋 {selectedSupermarketForCredentials.name} - Login Details
              </h2>
              <button
                onClick={closeCredentialsModal}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors flex-shrink-0"
                title="Close"
              >
                ×
              </button>
            </div>
                
            {loadingCredentials ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading credentials...</span>
              </div>
            ) : credentialsData ? (
              <div>
                {credentialsData.hasAccount ? (
                  <div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">
                        🔐 Login Credentials
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="bg-white rounded border p-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            📧 Email Address
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <div className="font-mono text-sm bg-gray-50 p-2 rounded border flex-1 break-all">
                              {credentialsData.user.email}
                            </div>
                            <button
                              onClick={() => copyToClipboard(credentialsData.user.email, 'email')}
                              className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 flex items-center justify-center gap-1 whitespace-nowrap"
                              title="Copy email to clipboard"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white rounded border p-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            🔒 Password
                          </label>
                          {newPasswordGenerated ? (
                            <div className="bg-green-50 border border-green-300 p-3 rounded">
                              <div className="text-green-800 text-sm font-semibold mb-2">
                                🎉 New Password Generated!
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                                <div className="font-mono text-lg bg-white p-2 rounded border border-green-300 select-all flex-1 break-all">
                                  {newPasswordGenerated}
                                </div>
                                <button
                                  onClick={() => copyToClipboard(newPasswordGenerated, 'password')}
                                  className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 flex items-center justify-center gap-1 whitespace-nowrap"
                                  title="Copy password to clipboard"
                                >
                                  📋 Copy
                                </button>
                              </div>
                              <div className="text-green-700 text-xs">
                                Password copied! Share it with the supermarket manager.
                              </div>
                            </div>
            ) : (
              <div>
                              <div className="text-sm bg-yellow-50 p-2 rounded border border-yellow-200 mb-3">
                                <span className="text-yellow-700">
                                  {credentialsData.note}
                                </span>
                              </div>
                              <button
                                onClick={() => handleResetPassword(credentialsData.supermarket.id)}
                                disabled={resettingPassword}
                                className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600 disabled:bg-orange-300 flex items-center gap-2"
                              >
                                {resettingPassword ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    🔄 Generate New Password
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
                      <h4 className="font-semibold text-gray-700 mb-3">📊 Market Account Information</h4>
                      <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Status</label>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                credentialsData.supermarket.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : credentialsData.supermarket.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {credentialsData.supermarket.status}
                                {credentialsData.supermarket.status === "INACTIVE" && " 🚫"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">User Role</label>
                            <div className="text-sm text-gray-800 mt-1">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                SUPERMARKET
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                          <div className="text-sm text-gray-800 mt-1">
                            {credentialsData.supermarket.phone || (
                              <span className="text-gray-400 italic">Not provided</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Market ID</label>
                          <div className="font-mono text-xs sm:text-sm text-gray-800 bg-white p-2 rounded border mt-1 break-all">
                            {credentialsData.supermarket.id}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Market Created</label>
                            <div className="text-sm text-gray-800 mt-1">
                              {new Date(credentialsData.supermarket.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(credentialsData.supermarket.createdAt).toLocaleTimeString()}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Account Created</label>
                            <div className="text-sm text-gray-800 mt-1">
                              {new Date(credentialsData.user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(credentialsData.user.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</label>
                          <div className="text-sm text-gray-800 mt-1">
                            {new Date(credentialsData.user.lastUpdated).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(credentialsData.user.lastUpdated).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                  
                      {/* Status Warnings */}
                      {credentialsData.supermarket.status === "INACTIVE" && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mt-4">
                          <div className="flex items-start gap-2">
                            <span className="text-red-500">⚠️</span>
                            <div>
                              <strong>Login Disabled:</strong> This user cannot log in while the supermarket is deactivated.
                              <br/>
                              <span className="text-xs">To allow login, activate the supermarket from the main list.</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {credentialsData.supermarket.status === "PENDING" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-700 text-sm mt-4">
                          <div className="flex items-start gap-2">
                            <span className="text-yellow-500">⏳</span>
                            <div>
                              <strong>Pending Activation:</strong> This supermarket needs to be activated before users can log in.
                              <br/>
                              <span className="text-xs">Use the &ldquo;Create Login&rdquo; button to activate and generate credentials.</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>


                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700 mb-4">
                      <strong>💡 Tip:</strong> Share the email address with the supermarket manager. 
                      If they need a new password, use the &ldquo;Create Login&rdquo; feature to reset their account.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-lg font-semibold text-red-600 mb-2">No Account Found</h3>
                    <p className="text-gray-600 mb-4">
                      This supermarket doesn&apos;t have a login account yet.
                    </p>
                    <button
                      onClick={() => {
                        closeCredentialsModal()
                        handleActivateSupermarket(selectedSupermarketForCredentials)
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Create Login Account
                    </button>
                  </div>
                )}
                
                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={closeCredentialsModal}
                    className="bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors w-full sm:w-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-red-600">
                <div className="text-4xl mb-2">⚠️</div>
                <p>Failed to load credentials</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Credentials Modal - shown after creating supermarket */}
      {showNewCredentialsModal && generatedCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-green-600">
                {credentialsModalTitle}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Here are the auto-generated login credentials
                  </p>
                </div>
                
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📧 Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm bg-white p-2 rounded border flex-1 break-all">
                      {generatedCredentials.email}
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedCredentials.email, 'email')}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 whitespace-nowrap"
                      title="Copy email to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🔒 Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-sm bg-white p-2 rounded border flex-1 break-all select-all">
                      {generatedCredentials.password}
                    </div>
                <button
                      onClick={() => copyToClipboard(generatedCredentials.password, 'password')}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 whitespace-nowrap"
                      title="Copy password to clipboard"
                >
                      📋
                </button>
              </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700 mb-4">
              <strong>💡 Important:</strong> Please share these credentials with the supermarket manager immediately. 
              You can also access them later by clicking on the supermarket in the list.
            </div>

            <button
              onClick={closeNewCredentialsModal}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold"
            >
              Got it! Close
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

