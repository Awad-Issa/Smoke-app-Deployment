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
      setRequests(data)
    } catch (error) {
      console.error("Error fetching requests:", error)
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Supermarket Registration Requests</h1>
        <button
          onClick={() => router.push("/admin/supermarkets")}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Manage Supermarkets
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Registration Requests</h2>
            <p className="text-sm text-gray-600 mt-1">
              {requests.filter(r => r.status === "PENDING").length} pending requests
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedRequest?.id === request.id ? "bg-blue-50" : ""
                }`}
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{request.supermarketName}</p>
                    <p className="text-sm text-gray-600">{request.contactEmail}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No registration requests found.
              </div>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Request Details</h2>
          </div>
          {selectedRequest ? (
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Supermarket Name</label>
                  <p className="text-lg font-medium">{selectedRequest.supermarketName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Email</label>
                  <p>{selectedRequest.contactEmail}</p>
                </div>
                {selectedRequest.contactPhone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p>{selectedRequest.contactPhone}</p>
                  </div>
                )}
                {selectedRequest.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p>{selectedRequest.address}</p>
                  </div>
                )}
                {selectedRequest.businessLicense && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business License</label>
                    <p>{selectedRequest.businessLicense}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Requested Date</label>
                  <p>{new Date(selectedRequest.requestedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedRequest.status
                    )}`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {selectedRequest.status === "PENDING" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      rows={3}
                      placeholder="Add notes about this decision..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Approve & Create Supermarket
                    </button>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Reject Request
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    💡 Approving will create the supermarket and generate login credentials
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select a request to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

