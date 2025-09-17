"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterSupermarketPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    supermarketName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    businessLicense: ""
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/supermarket-requests", {
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
        alert(error.error || "Failed to submit request")
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      alert("Failed to submit request")
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
            Request Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Your supermarket registration request has been submitted. 
            Our admin team will review your application and contact you within 2-3 business days.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setSubmitted(false)}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Submit Another Request
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Our Smoke Platform
          </h1>
          <p className="text-gray-600">
            Register your supermarket to access our wholesale smoke products
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="Your Supermarket Name"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                required
                placeholder="contact@yoursupermarket.com"
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
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Business License #
              </label>
              <input
                type="text"
                value={formData.businessLicense}
                onChange={(e) => setFormData({...formData, businessLicense: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Business License Number"
              />
            </div>
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
              placeholder="Your business address..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Registration Process</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Submit your registration request</li>
              <li>• Admin reviews your application (2-3 business days)</li>
              <li>• Pay one-time platform fee ($70) upon approval</li>
              <li>• Receive login credentials and start ordering</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-500 text-white py-3 px-6 rounded font-medium hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Registration Request"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="bg-gray-500 text-white py-3 px-6 rounded font-medium hover:bg-gray-600"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

