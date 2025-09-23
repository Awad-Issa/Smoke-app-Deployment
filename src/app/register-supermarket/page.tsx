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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-3 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md w-full min-w-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8 text-center overflow-hidden">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Request Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
            Your supermarket registration request has been submitted. 
            Our admin team will review your application and contact you within 2-3 business days.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setSubmitted(false)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 active:transform-none"
            >
              Submit Another Request
            </button>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-gray-500 text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 active:transform-none"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-2xl w-full min-w-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-6 lg:p-8 overflow-hidden">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Join Our Smoke Platform
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Register your supermarket to access our wholesale smoke products
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full">
          <div className="w-full space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 lg:gap-6">
            <div className="sm:col-span-2 w-full">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Supermarket Name *
              </label>
              <input
                type="text"
                value={formData.supermarketName}
                onChange={(e) => setFormData({...formData, supermarketName: e.target.value})}
                className="w-full max-w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white"
                required
                placeholder="Your Supermarket Name"
              />
            </div>

            <div className="w-full">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                className="w-full max-w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white"
                required
                placeholder="contact@yoursupermarket.com"
              />
            </div>

            <div className="w-full">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                className="w-full max-w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="sm:col-span-2 w-full">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Business License #
              </label>
              <input
                type="text"
                value={formData.businessLicense}
                onChange={(e) => setFormData({...formData, businessLicense: e.target.value})}
                className="w-full max-w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white"
                placeholder="Business License Number"
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Business Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full max-w-full px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm bg-gray-50 focus:bg-white resize-none"
              rows={3}
              placeholder="Your business address..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2 sm:mb-3">📋 Registration Process</h3>
            <ul className="text-blue-700 text-sm space-y-1 sm:space-y-1.5">
              <li>• Submit your registration request</li>
              <li>• Admin reviews your application (2-3 business days)</li>
              <li>• Pay one-time platform fee ($70) upon approval</li>
              <li>• Receive login credentials and start ordering</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 sm:py-3 px-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:transform-none"
            >
              {loading ? "Submitting..." : "Submit Registration Request"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="sm:w-auto bg-gray-500 text-white py-2.5 sm:py-3 px-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 active:transform-none"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

