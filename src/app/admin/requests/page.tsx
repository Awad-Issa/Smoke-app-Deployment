"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface SupermarketRequest {
  id: string
  supermarketName: string
  contactEmail: string
  contactPhone?: string
  address?: string
  businessLicense?: string
  status: string
  notes?: string
  requestedAt: string
  reviewedAt?: string
}

export default function AdminRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<SupermarketRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<SupermarketRequest | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "SUPER_ADMIN") {
      router.push("/login")
      return
    }
    fetchRequests()
  }, [session, status, router])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/supermarket-requests")
      const data = await response.json()
      
      // Handle errors
      if (!response.ok || data.error) {
        console.error("API Error:", data.error || "Failed to fetch requests")
        setRequests([]) // Set empty array instead of error object
        return
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRequests(data)
      } else {
        console.error("Invalid data format - expected array, got:", typeof data)
        setRequests([])
      }
    } catch (error) {
      console.error("Error fetching requests:", error)
      setRequests([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      const response = await fetch(`/api/admin/supermarket-requests/${requestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notes: reviewNotes })
      })

      if (response.ok) {
        fetchRequests()
        setSelectedRequest(null)
        setReviewNotes("")
        alert("Supermarket approved successfully! They will receive login credentials.")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to approve request")
      }
    } catch (error) {
      console.error("Error approving request:", error)
      alert("Failed to approve request")
    }
  }

  const handleReject = async (requestId: string) => {
    if (!reviewNotes.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    try {
      const response = await fetch(`/api/admin/supermarket-requests/${requestId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ notes: reviewNotes })
      })

      if (response.ok) {
        fetchRequests()
        setSelectedRequest(null)
        setReviewNotes("")
        alert("Request rejected")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to reject request")
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      alert("Failed to reject request")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">👑 Admin Requests</h1>
              <p className="text-sm text-gray-600">{requests.filter(r => r.status === "PENDING").length} pending</p>
            </div>
            <button
              onClick={() => router.push("/admin/supermarkets")}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">

        {requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No requests yet</h3>
            <p className="text-gray-500 mb-6">Registration requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer transition-all mb-4 ${
                  selectedRequest?.id === request.id ? "ring-2 ring-blue-500 border-blue-200" : ""
                }`}
                onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
              >
                {/* Request Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">🏪 {request.supermarketName}</h3>
                      <p className="text-sm text-gray-600">📧 {request.contactEmail}</p>
                      <p className="text-sm text-gray-600">
                        📅 {new Date(request.requestedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                        {request.status === "PENDING" ? "⏳ Pending" : 
                         request.status === "APPROVED" ? "✅ Approved" : 
                         "❌ Rejected"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Request Summary */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <span className="text-gray-700 font-medium">
                      {request.contactPhone ? "📞 Phone provided" : "📞 No phone"}
                    </span>
                    <button className="text-blue-600 font-semibold text-sm">
                      {selectedRequest?.id === request.id ? 'Hide Details' : 'View Details'} →
                    </button>
                  </div>
                </div>
                
                {/* Request Details (Expanded) */}
                {selectedRequest?.id === request.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="p-4">
                      {/* Request Information */}
                      <div className="space-y-3 mb-4">
                        <h4 className="font-semibold text-gray-900">📋 Request Details</h4>
                        <div className="bg-white rounded-xl p-3 space-y-2 text-sm">
                          <div><strong>📧 Email:</strong> {request.contactEmail}</div>
                          {request.contactPhone && (
                            <div><strong>📞 Phone:</strong> {request.contactPhone}</div>
                          )}
                          {request.address && (
                            <div><strong>📍 Address:</strong> {request.address}</div>
                          )}
                          {request.businessLicense && (
                            <div><strong>📄 Business License:</strong> {request.businessLicense}</div>
                          )}
                          {request.reviewedAt && (
                            <div><strong>👁️ Reviewed:</strong> {new Date(request.reviewedAt).toLocaleString()}</div>
                          )}
                          {request.notes && (
                            <div><strong>📝 Notes:</strong> {request.notes}</div>
                          )}
                        </div>
                      </div>

                      {/* Review Actions for Pending Requests */}
                      {request.status === "PENDING" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              📝 Review Notes (optional)
                            </label>
                            <textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows={3}
                              placeholder="Add any notes about this review..."
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(request.id);
                              }}
                              className="flex-1 bg-green-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-600 transition-all"
                            >
                              ✅ Approve Request
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(request.id);
                              }}
                              className="px-6 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-all"
                            >
                              ❌ Reject
                            </button>
                          </div>
                          <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-xl">
                            💡 <strong>Approving</strong> will create the supermarket and generate login credentials
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

          </div>
        )}
       </div>
    </div>
  )
}
