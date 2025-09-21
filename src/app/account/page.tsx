"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AccountInfo {
  user: {
    id: string
    email: string
    createdAt: string
    updatedAt: string
  }
  supermarket: {
    id: string
    name: string
    status: string
    createdAt: string
  }
  statistics: {
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    totalValue: number
    totalUsers: number
    lastOrderDate: string | null
  }
  recentOrders: Array<{
    id: string
    status: string
    total: number
    itemCount: number
    createdAt: string
  }>
}

export default function AccountPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "SUPERMARKET") {
      router.push("/login")
      return
    }
    fetchAccountInfo()
  }, [session, status, router])

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch("/api/supermarket/account")
      const data = await response.json()
      
      if (response.ok) {
        setAccountInfo(data)
      } else {
        // Handle deactivation error
        if (response.status === 403 && data.code === "ACCOUNT_DEACTIVATED") {
          alert(data.message || "Your account has been deactivated. You will be logged out.")
          // Redirect to login with deactivation message
          window.location.href = "/login?error=account_deactivated"
          return
        }
        
        console.error("Failed to fetch account info:", data.error || "Unknown error")
      }
    } catch (error) {
      console.error("Error fetching account info:", error)
    } finally {
      setLoading(false)
    }
  }

  // Password change handlers
  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear errors when user starts typing
    if (passwordError) setPasswordError('')
    if (passwordSuccess) setPasswordSuccess('')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setPasswordError('')
    setPasswordSuccess('')
    
    // Basic validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All password fields are required')
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long')
      return
    }
    
    setPasswordLoading(true)
    
    try {
      const response = await fetch('/api/supermarket/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setPasswordSuccess('Password changed successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setTimeout(() => {
          setShowPasswordForm(false)
          setPasswordSuccess('')
        }, 2000)
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      setPasswordError('Failed to change password. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setPasswordError('')
    setPasswordSuccess('')
    setShowPasswordForm(false)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (!accountInfo) {
    return <div className="flex justify-center items-center h-screen">No account information available.</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">My Account</h1>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            🏪 {accountInfo.supermarket.name}
          </span>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Browse Products
          </button>
          <button
            onClick={() => router.push("/orders")}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            My Orders
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              👤 Profile Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Supermarket Name</label>
                <div className="text-lg font-semibold text-gray-800 mt-1">
                  {accountInfo.supermarket.name}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Account Status</label>
                <div className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    accountInfo.supermarket.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : accountInfo.supermarket.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {accountInfo.supermarket.status}
                    {accountInfo.supermarket.status === "ACTIVE" && " ✅"}
                    {accountInfo.supermarket.status === "INACTIVE" && " 🚫"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="text-lg text-gray-800 mt-1 font-mono">
                  {accountInfo.user.email}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Member Since</label>
                <div className="text-lg text-gray-800 mt-1">
                  {new Date(accountInfo.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              📦 Recent Orders
            </h2>
            {accountInfo.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {accountInfo.recentOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-800">
                          Order #{order.id.slice(-8)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {order.itemCount} items • ${order.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : order.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "SHIPPED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-4">
                  <button
                    onClick={() => router.push("/orders")}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All Orders →
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📦</div>
                <p>No orders yet</p>
                <button
                  onClick={() => router.push("/products")}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Browse Products to get started →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Account Statistics */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-md p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              📊 Account Statistics
            </h3>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {accountInfo.statistics.totalOrders}
                </div>
                <div className="text-sm text-blue-600 font-medium">Total Orders</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {accountInfo.statistics.pendingOrders}
                  </div>
                  <div className="text-xs text-orange-600">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {accountInfo.statistics.completedOrders}
                  </div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
              </div>
              
              <div className="text-center pt-2 border-t border-blue-200">
                <div className="text-2xl font-bold text-purple-600">
                  ${accountInfo.statistics.totalValue.toFixed(2)}
                </div>
                <div className="text-sm text-purple-600 font-medium">Total Spent</div>
              </div>
              
              {accountInfo.statistics.lastOrderDate && (
                <div className="pt-2 border-t border-blue-200">
                  <div className="text-sm text-blue-700">
                    <strong>Last Order:</strong><br/>
                    {new Date(accountInfo.statistics.lastOrderDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              ⚡ Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/products")}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                🛒 Browse Products
              </button>
              <button
                onClick={() => router.push("/cart")}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
              >
                🛍️ View Cart
              </button>
              <button
                onClick={() => router.push("/orders")}
                className="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600 transition-colors"
              >
                📋 Order History
              </button>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🔐 Security Settings
            </h3>
            
            {!showPasswordForm ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Keep your account secure by updating your password regularly.
                </p>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  🔄 Change Password
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter current password"
                    required
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter new password (8+ characters)"
                    required
                    minLength={8}
                  />
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    ⚠️ {passwordError}
                  </div>
                )}

                {/* Success Message */}
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                    ✅ {passwordSuccess}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded hover:bg-orange-600 transition-colors disabled:bg-orange-300 flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Changing...
                      </>
                    ) : (
                      <>
                        ✅ Update Password
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetPasswordForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">Account Details</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Account ID:</strong> {accountInfo.user.id.slice(-8)}</div>
              <div><strong>Market ID:</strong> {accountInfo.supermarket.id.slice(-8)}</div>
              <div><strong>Last Updated:</strong> {new Date(accountInfo.user.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
